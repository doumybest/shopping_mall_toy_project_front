<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api/http'
import { useShop } from '../composables/useShop'
import type { EventBanner, EventInput, ShopEvent } from '../types/api'
import { money } from '../utils/format'

const props = defineProps<{ eventId?: number }>()
const { busy, events, run } = useShop()
const managed = ref<ShopEvent[]>([])
const editing = ref<number | null>(null)
const deleting = ref<number | null>(null)
const hadImage = ref(false)
const imageFile = ref<HTMLInputElement>()
const readingImage = ref(false)
const imageError = ref('')
const blank = (): EventInput => ({ title: '', description: '', startsAt: '', endsAt: '', discount: 0, enabled: false })
const form = reactive(blank())

async function load() {
  managed.value = await api<ShopEvent[]>('/admin/events')
}
onMounted(() => {
  void run(async () => {
    await load()
    const target = managed.value.find(event => event.id === props.eventId)
    if (target) edit(target)
  })
})

function edit(event?: ShopEvent) {
  deleting.value = null
  editing.value = event?.id ?? null
  hadImage.value = event?.hasImage ?? false
  imageError.value = ''
  if (imageFile.value) imageFile.value.value = ''
  form.imageData = undefined
  Object.assign(form, event ? {
    title: event.title, description: event.description, startsAt: event.startsAt.slice(0, 16),
    endsAt: event.endsAt.slice(0, 16), discount: event.discount, enabled: event.enabled,
  } : blank())
}

async function remove(event: ShopEvent) {
  await run(async () => {
    await api(`/admin/events/${event.id}`, { method: 'DELETE' })
    deleting.value = null
    if (editing.value === event.id) edit()
    managed.value = managed.value.filter(item => item.id !== event.id)
    events.value = events.value.filter(item => item.id !== event.id)
  }, 'イベントを削除しました。')
}

async function chooseImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  imageError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 512 * 1024) {
    imageError.value = 'JPEG・PNG・WebP の画像を512 KB以内で選択してください。'
    input.value = ''
    return
  }
  readingImage.value = true
  try {
    form.imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  } catch {
    imageError.value = '画像を読み込めませんでした。'
    input.value = ''
  } finally {
    readingImage.value = false
  }
}

async function save() {
  if (readingImage.value) return
  const id = editing.value
  await run(async () => {
    await api(id === null ? '/admin/events' : `/admin/events/${id}`, {
      method: id === null ? 'POST' : 'PUT', body: { ...form },
    })
    edit()
    await load()
    events.value = await api<EventBanner[]>('/events')
  }, 'イベントを保存しました。')
}
</script>

<template>
  <div class="page-title"><h1>イベント管理</h1></div>
  <div class="checkout-layout">
    <section class="surface stack checkout-form">
      <h2>イベント一覧</h2>
      <p v-if="!managed.length && !busy">イベントはまだありません。</p>
      <article v-for="event in managed" :key="event.id" class="section-heading">
        <div>
          <h3>{{ event.title }}</h3>
          <p>{{ event.enabled ? '公開設定オン' : '非公開' }} · {{ event.discount ? money(event.discount) + '引き' : 'クーポンなし' }}</p>
          <p class="small muted">{{ event.startsAt.slice(0, 16).replace('T', ' ') }} ～ {{ event.endsAt.slice(0, 16).replace('T', ' ') }} JST</p>
        </div>
        <div class="event-actions">
          <template v-if="deleting === event.id">
            <small>バナーと詳細ページを公開終了します。発行済みクーポンと注文履歴は保持されます。</small>
            <button type="button" class="danger-button" :disabled="busy || readingImage" @click="remove(event)">削除を確定</button>
            <button type="button" class="secondary" :disabled="busy" @click="deleting = null">戻る</button>
          </template>
          <template v-else>
            <button type="button" class="secondary" :disabled="busy || readingImage" @click="edit(event)">編集</button>
            <button type="button" class="danger-button" :disabled="busy || readingImage" @click="deleting = event.id">削除</button>
          </template>
        </div>
      </article>
    </section>
    <form class="surface stack checkout-form" @submit.prevent="save">
      <h2>{{ editing === null ? 'イベントを作成' : 'イベントを編集' }}</h2>
      <label>タイトル<input v-model="form.title" required maxlength="100" /></label>
      <label>バナーの説明<textarea v-model="form.description" required maxlength="500" /></label>
      <label>イベント画像<input ref="imageFile" type="file" accept="image/jpeg,image/png,image/webp"
        :disabled="busy || readingImage" @change="chooseImage" /><small>JPEG・PNG・WebP、512 KBまで</small></label>
      <p v-if="imageError" class="inline-error" role="alert">{{ imageError }}</p>
      <img v-if="form.imageData" :src="form.imageData" alt="イベント画像のプレビュー" style="max-width: 100%; max-height: 180px; object-fit: contain; align-self: start" />
      <p v-else-if="hadImage && form.imageData === undefined" class="small">登録済みの画像があります。</p>
      <button v-if="form.imageData || (hadImage && form.imageData === undefined)" type="button" class="secondary"
        :disabled="busy || readingImage" @click="form.imageData = ''; if (imageFile) imageFile.value = ''">画像を取り除く</button>
      <label>開始日時 (JST)<input v-model="form.startsAt" type="datetime-local" required /></label>
      <label>終了日時 (JST)<input v-model="form.endsAt" type="datetime-local" required /></label>
      <label>クーポン割引 (円)<input v-model.number="form.discount" type="number" required min="0" max="1000000" step="1" /><small>0 円の場合はバナーのみ表示します。</small></label>
      <label class="checkbox"><input v-model="form.enabled" type="checkbox" />期間中にバナーを公開</label>
      <button type="submit" class="primary" :disabled="busy || readingImage">イベントを保存</button>
      <button v-if="editing !== null" type="button" class="secondary" :disabled="busy || readingImage" @click="edit()">新規作成に戻る</button>
    </form>
  </div>
</template>

<style scoped>
.event-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.event-actions small { flex-basis: 100%; }
</style>
