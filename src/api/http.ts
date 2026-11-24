export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError' }
}
interface Csrf { token: string; headerName: string }
let csrf: Csrf | undefined
let csrfRequest: Promise<Csrf> | undefined
export async function refreshCsrf() {
  csrfRequest = fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new ApiError('セキュリティ情報を取得できませんでした。接続をご確認ください。', response.status)
      csrf = await response.json() as Csrf
      return csrf
    }).finally(() => { csrfRequest = undefined })
  return csrfRequest
}
interface ApiOptions { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: object; form?: boolean }
export async function api<T = void>(path: string, { method = 'GET', body, form }: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (!['GET', 'HEAD'].includes(method)) {
    if (!csrf) await (csrfRequest || refreshCsrf())
    if (!csrf) throw new ApiError('セキュリティ情報を取得できませんでした。', 0)
    headers[csrf.headerName] = csrf.token
  }
  if (body !== undefined) headers['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json'
  let response
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', headers, cache: 'no-store',
      body: body === undefined ? undefined : form ? new URLSearchParams(body as Record<string, string>) : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
  } catch { throw new ApiError('サーバーの応答を確認できません。注文履歴を確認してから、もう一度お試しください。', 0) }
  const text = await response.text()
  let data: unknown
  try { data = text ? JSON.parse(text) : undefined } catch { data = undefined }
  if (!response.ok) {
    if (response.status === 403) csrf = undefined
    const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string' ? data.message : undefined
    throw new ApiError(message || `リクエストを処理できませんでした。 (${response.status})`, response.status)
  }
  return data as T
}
