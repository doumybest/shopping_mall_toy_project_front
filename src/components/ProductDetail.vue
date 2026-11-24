<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { api } from '../api/http'
import { money, date } from '../utils/format'
import { categoryLabel } from '../utils/categories'
import type { Product, Member, Review, RunAction } from '../types/api'
const props = defineProps<{ product: Product; user: Member | null; busy: boolean; run: RunAction; errorMessage: string }>()
defineEmits<{ close: []; add: [product: Product] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const reviews = ref<Review[]>([])
const loading = ref(true)
const error = ref('')
const form = reactive({ rating: 5, content: '' })
const average = computed(() => reviews.value.length ? (reviews.value.reduce((sum, item) => sum + item.rating, 0) / reviews.value.length).toFixed(1) : '—')
async function load() {
  loading.value = true; error.value = ''
  try { reviews.value = await api<Review[]>(`/products/${props.product.id}/reviews`) }
  catch (ex) { error.value = ex instanceof Error ? ex.message : '処理に失敗しました。' }
  finally { loading.value = false }
}
async function submit() {
  if (await props.run(async () => {
    await api(`/products/${props.product.id}/reviews`, { method: 'POST', body: { rating: Number(form.rating), content: form.content } })
    await load()
  }, 'レビューを投稿しました。')) form.content = ''
}
async function remove(id: number) {
  await props.run(async () => { await api(`/reviews/${id}`, { method: 'DELETE' }); await load() }, 'レビューを削除しました。')
}
const previousOverflow = document.body.style.overflow
onMounted(() => { dialog.value?.showModal(); document.body.style.overflow = 'hidden'; load() })
onUnmounted(() => { document.body.style.overflow = previousOverflow })
</script>
<template>
  <dialog ref="dialog" class="product-dialog" aria-labelledby="detail-title" @cancel.prevent="$emit('close')" @click="(event) => { if (event.target === dialog) $emit('close') }">
    <div class="section-heading"><p class="eyebrow">商品詳細</p><button class="secondary" aria-label="商品詳細を閉じる" @click="$emit('close')">閉じる ×</button></div>
    <p v-if="errorMessage" class="inline-error" role="alert">{{ errorMessage }}</p>
    <div class="detail-top"><div class="detail-visual"><img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" referrerpolicy="no-referrer" /><span v-else>{{ product.emoji }}</span></div><div><p class="product-meta">{{ categoryLabel(product.category) }} · 在庫 {{ product.stock }}個</p><h2 id="detail-title">{{ product.name }}</h2><p class="detail-description">{{ product.description }}</p><strong>{{ money(product.price) }}</strong><p class="muted small">決済金額の1% ポイント還元 · 送料無料</p><button class="primary" :disabled="busy || !product.stock" @click="$emit('add', product)">{{ product.stock ? 'カートに追加' : '在庫切れ' }}</button></div></div>
    <section class="review-section"><h3>購入者レビュー · {{ reviews.length }}件 <span class="muted">★ {{ average }}</span></h3><p v-if="loading" role="status">レビューを読み込んでいます…</p><p v-else-if="error" class="inline-error" role="alert">{{ error }}</p><p v-else-if="!reviews.length" class="muted">レビューはまだありません。</p><article v-for="review in reviews" :key="review.id" class="review"><div class="section-heading"><strong>{{ review.author }} · {{ '★'.repeat(review.rating) }}</strong><button v-if="user?.id === review.memberId" class="text-button" :disabled="busy" @click="remove(review.id)">削除</button></div><p>{{ review.content }}</p><small class="muted">{{ date(review.createdAt) }}</small></article>
      <form v-if="user" class="stack review-form" @submit.prevent="submit"><p class="muted small">購入済みの商品に、お一人様1件までレビューを投稿できます。</p><label>評価<select v-model.number="form.rating"><option v-for="star in 5" :key="star" :value="star">{{ star }}点</option></select></label><label>レビュー<textarea v-model="form.content" required maxlength="1000" rows="3" placeholder="使ってみた感想をお聞かせください。" /></label><button class="secondary" :disabled="busy">レビューを投稿</button></form><p v-else class="muted small">ログインすると、購入した商品のレビューを投稿できます。</p>
    </section>
  </dialog>
</template>
