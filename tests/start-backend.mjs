import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createServer as createSmtpServer } from 'node:net'
import { createServer as createHttpServer } from 'node:http'

// Only this test runner starts a loopback mailbox. Production has no code-retrieval endpoint.
const inbox = new Map()
const smtp = createSmtpServer((socket) => {
  let buffer = '', recipient = '', data = null
  socket.setEncoding('utf8')
  socket.write('220 localhost test SMTP\r\n')
  socket.on('data', (chunk) => {
    buffer += chunk
    let index
    while ((index = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, index)
      buffer = buffer.slice(index + 2)
      if (data !== null) {
        if (line === '.') {
          const message = data.join('\r\n')
          const split = message.indexOf('\r\n\r\n')
          const headers = message.slice(0, split)
          let body = message.slice(split + 4)
          if (/Content-Transfer-Encoding:\s*base64/i.test(headers)) body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8')
          else if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(headers)) body = body.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, value) => String.fromCharCode(parseInt(value, 16)))
          const code = body.match(/Code: ([0-9]{6})/)?.[1]
          if (code) inbox.set(recipient, code)
          data = null; socket.write('250 Accepted\r\n')
        } else data.push(line)
      } else if (/^(EHLO|HELO|MAIL FROM|RSET)/.test(line)) socket.write('250 OK\r\n')
      else if (line.startsWith('RCPT TO')) { recipient = line.match(/<([^>]+)>/)?.[1]; socket.write('250 OK\r\n') }
      else if (line === 'DATA') { data = []; socket.write('354 End with dot\r\n') }
      else if (line === 'QUIT') socket.end('221 Bye\r\n')
      else socket.write('250 OK\r\n')
    }
  })
  socket.on('error', () => {})
})
const mailbox = createHttpServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')
  const code = url.pathname === '/mail' ? inbox.get(url.searchParams.get('email')) : null
  res.writeHead(code ? 200 : 404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(code ? { code } : { message: 'No test message' }))
})
await Promise.all([
  new Promise((resolve, reject) => { smtp.once('error', reject); smtp.listen(11025, '127.0.0.1', resolve) }),
  new Promise((resolve, reject) => { mailbox.once('error', reject); mailbox.listen(18081, '127.0.0.1', resolve) }),
])
const jar = resolve(process.env.E2E_BACKEND_JAR || '../back/target/shopping-mall-0.1.0-SNAPSHOT.jar')
if (!existsSync(jar)) throw new Error('먼저 back에서 Maven verify를 실행해 JAR을 생성해 주세요.')
const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java'
const child = spawn(java, ['-jar', jar, '--server.port=18080', '--spring.profiles.active=demo',
  '--spring.datasource.url=jdbc:h2:mem:e2e;MODE=Oracle;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1',
  '--mall.admin.email=e2e-admin@test.example', '--mall.admin.password=E2E-Admin!12345',
  '--spring.mail.host=127.0.0.1', '--spring.mail.port=11025', '--mall.mail-from=no-reply@test.example',
  '--spring.mail.properties[mail.smtp.auth]=false', '--spring.mail.properties[mail.smtp.starttls.enable]=false',
  '--spring.mail.properties[mail.smtp.starttls.required]=false',
], { stdio: 'inherit', windowsHide: true })
child.on('error', (error) => { console.error(error.message); process.exit(1) })
child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(); process.exit(0) })
