<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { api } from '../api/http'

import type { AuthInput, EmailSent, EmailVerified } from '../types/api'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const props = defineProps<{ busy: boolean; submit: (form: AuthInput, registering: boolean) => Promise<boolean> }>()
const registering = computed(() => route.name === 'register')
const form = reactive({ email: '', password: '', name: '' })
const confirmation = ref('')
const localError = ref('')
const emailNotice = ref('')
const pending = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const code = ref('')
const sentEmail = ref('')
const verifiedEmail = ref('')
const codeExpiresAt = ref(0)
const proofExpiresAt = ref(0)
const nextSendAt = ref(0)
const now = ref(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => clearInterval(clock))
const normalizedEmail = computed(() => form.email.trim().toLowerCase())
const working = computed(() => pending.value || props.busy)
const verified = computed(() => verifiedEmail.value === normalizedEmail.value && now.value < proofExpiresAt.value)
const sent = computed(() => !!sentEmail.value && sentEmail.value === normalizedEmail.value)
const resendSeconds = computed(() => Math.max(0, Math.ceil((nextSendAt.value - now.value) / 1000)))
const codeSeconds = computed(() => Math.max(0, Math.ceil((codeExpiresAt.value - now.value) / 1000)))
const timeLeft = computed(() => `${Math.floor(codeSeconds.value / 60)}:${String(codeSeconds.value % 60).padStart(2, '0')}`)

function resetVerification() {
  code.value = ''; sentEmail.value = ''; verifiedEmail.value = ''
  codeExpiresAt.value = 0; proofExpiresAt.value = 0; nextSendAt.value = 0
  emailNotice.value = ''; localError.value = ''
}
watch(normalizedEmail, resetVerification)

async function sendCode() {
  if (working.value || resendSeconds.value) return
  if (!emailInput.value?.reportValidity()) return
  pending.value = true; localError.value = ''; emailNotice.value = ''
  verifiedEmail.value = ''; proofExpiresAt.value = 0; code.value = ''
  try {
    const result = await api<EmailSent>('/auth/email/send', { method: 'POST', body: { email: normalizedEmail.value } })
    now.value = Date.now()
    sentEmail.value = normalizedEmail.value
    codeExpiresAt.value = now.value + result.expiresInSeconds * 1000
    nextSendAt.value = now.value + result.retryAfterSeconds * 1000
    emailNotice.value = '認証コードを送信しました。迷惑メールフォルダーもご確認ください。'
  } catch (error) { localError.value = error instanceof Error ? error.message : '処理に失敗しました。' }
  finally { pending.value = false }
}

async function verifyCode() {
  if (working.value) return
  if (!/^[0-9]{6}$/.test(code.value)) { localError.value = '6桁の認証コードを入力してください。'; return }
  pending.value = true; localError.value = ''; emailNotice.value = ''
  try {
    const result = await api<EmailVerified>('/auth/email/verify', { method: 'POST', body: { email: normalizedEmail.value, code: code.value } })
    now.value = Date.now()
    verifiedEmail.value = normalizedEmail.value
    proofExpiresAt.value = now.value + result.validForSeconds * 1000
    code.value = ''
    emailNotice.value = 'メール認証が完了しました。10分以内に会員登録を完了してください。'
  } catch (error) { localError.value = error instanceof Error ? error.message : '処理に失敗しました。' }
  finally { pending.value = false }
}

async function send() {
  if (working.value) return
  localError.value = ''
  if (registering.value && !verified.value) { localError.value = 'メール認証を先に完了してください。'; return }
  if (registering.value && form.password !== confirmation.value) { localError.value = '確認用パスワードが一致しません。'; return }
  if (await props.submit({ ...form, email: normalizedEmail.value }, registering.value)) { form.password = ''; confirmation.value = '' }
}

function toggle() {
  void router.push({ name: registering.value ? 'login' : 'register', query: route.query })
  form.password = ''; confirmation.value = ''; resetVerification()
}
</script>

<template>
  <section class="auth-card surface">
    <p class="eyebrow">ソソマーケットへようこそ</p><h1>{{ registering ? 'はじめての方へ' : 'おかえりなさい。' }}</h1>
    <p class="muted">{{ registering ? 'メールアドレスを認証して、お買い物をはじめましょう。' : 'カートやポイントをまとめて管理できます。' }}</p>
    <form @submit.prevent="send" class="stack">
      <label v-if="registering">お名前<input v-model="form.name" required maxlength="50" autocomplete="name" :disabled="working" /></label>
      <div class="email-field">
        <label>メールアドレス<input ref="emailInput" v-model="form.email" type="email" required maxlength="200" autocomplete="username" :disabled="working" /></label>
        <button v-if="registering" type="button" class="secondary" :disabled="working || resendSeconds > 0 || verified" @click="sendCode">{{ verified ? '認証済み' : resendSeconds > 0 ? `${resendSeconds}秒後に再送信` : sent ? '認証コードを再送信' : '認証コードを送信' }}</button>
      </div>
      <div v-if="registering && sent && !verified" class="verification-box stack">
        <label for="signup-email-code">メール認証コード</label>
        <div class="input-row"><input id="signup-email-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6桁の数字" :disabled="working || codeSeconds === 0" /><button type="button" class="secondary" :disabled="working || code.length !== 6 || codeSeconds === 0" @click="verifyCode">認証コードを確認</button></div>
        <small class="muted" role="timer">{{ codeSeconds > 0 ? `有効時間 ${timeLeft} · 入力は5回まで` : '認証コードの有効期限が切れました。再送信してください。' }}</small>
      </div>
      <p v-if="registering && verified" class="verification-success">✓ メール認証済み</p>
      <p v-if="registering && verifiedEmail && !verified" class="inline-error">会員登録の有効期限が切れました。もう一度認証してください。</p>
      <p v-if="emailNotice" class="small muted" role="status">{{ emailNotice }}</p>
      <label>パスワード<input v-model="form.password" type="password" required :minlength="registering ? 10 : 1" maxlength="64" :autocomplete="registering ? 'new-password' : 'current-password'" :disabled="working" /></label>
      <small v-if="registering" class="muted">10～64文字、UTF-8で最大72バイトまで設定できます。</small>
      <label v-if="registering">パスワード（確認）<input v-model="confirmation" type="password" required autocomplete="new-password" :disabled="working" /></label>
      <p v-if="localError" class="inline-error" role="alert">{{ localError }}</p>
      <button class="primary" :disabled="working || (registering && !verified)">{{ working ? '処理中…' : registering ? '会員登録する' : 'ログイン' }}</button>
    </form>
    <button class="text-button" :disabled="working" @click="toggle">{{ registering ? 'アカウントをお持ちの方 · ログイン' : 'はじめての方 · 新規登録' }}</button>
  </section>
</template>

<style scoped>
.email-field { display: flex; gap: 8px; align-items: flex-end; }
.email-field label { flex: 1; min-width: 0; }
.email-field > button { min-height: 44px; }
.verification-box { background: #f4f6ef; border: 1px solid #e0e7d8; padding: 14px; border-radius: 6px; gap: 8px; }
.verification-success { color: #426f39; font-size: 12px; margin: 0; }
@media(max-width: 420px) { .email-field { flex-wrap: wrap; } .email-field label { flex-basis: 100%; } .email-field > button { width: 100%; } .verification-box .input-row { flex-wrap: wrap; } }
</style>
