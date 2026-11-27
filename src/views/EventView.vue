<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError, api } from '../api/http'
import { useShop } from '../composables/useShop'
import type { EventBanner } from '../types/api'
import { money } from '../utils/format'
import { popupPosition } from '../utils/popupPosition'

const route = useRoute()
const { user, busy, claimCoupon, claimedEventIds } = useShop()
const event = ref<EventBanner>()
const loading = ref(true)
const message = ref('')
const claimed = computed(() => !!event.value && claimedEventIds.value.includes(event.value.id))

watch(() => route.params.id, async (id, _previous, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  loading.value = true
  message.value = ''
  event.value = undefined
  try {
    const result = await api<EventBanner>(`/events/${id}`)
    if (current) event.value = result
  } catch (error) {
    if (current) message.value = error instanceof ApiError ? error.message : 'イベントを読み込めませんでした。'
  } finally {
    if (current) loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <RouterLink :to="{ name: 'shop' }">← 商品一覧へ</RouterLink>
  <p v-if="loading" role="status">イベントを読み込んでいます…</p>
  <p v-else-if="message" class="banner error" role="alert">{{ message }}</p>
  <article v-else-if="event" class="event-detail surface stack">
    <h1>{{ event.title }}</h1>
    <img v-if="event.hasImage" :src="`/api/events/${event.id}/image`" :alt="event.title" />
    <p>{{ event.description }}</p>
    <small>終了 {{ event.endsAt.slice(0, 16).replace('T', ' ') }} JST</small>
    <RouterLink v-if="user?.role === 'ADMIN'" class="secondary"
      :to="{ name: 'admin', query: { event: event.id } }">イベント・画像を編集</RouterLink>
    <button v-if="event.discount" type="button" class="primary" :disabled="busy || claimed"
      @click="claimCoupon(event.id, popupPosition($event))">
      {{ claimed ? 'クーポン受取済み' : `${money(event.discount)} クーポンを受け取る` }}
    </button>
  </article>
</template>

<style scoped>
.event-detail { margin-top: 18px; align-items: start; }
.event-detail img { max-width: 100%; max-height: 65vh; object-fit: contain; border-radius: 8px; }
.event-detail p { margin: 0; white-space: pre-wrap; }
</style>
