<script setup lang="ts">
import { computed, ref } from 'vue'
import { money } from '../utils/format'
import { categoryLabel } from '../utils/categories'
import type { Product } from '../types/api'
const props = defineProps<{ products: Product[]; wishlist: Product[]; busy: boolean; wishedOnly: boolean }>()
defineEmits<{ add: [product: Product]; wish: [product: Product]; detail: [product: Product] }>()
const search = ref('')
const category = ref('すべて')
const sort = ref('latest')
const categories = computed(() => ['すべて', ...new Set(props.products.map((item) => categoryLabel(item.category)))])
const wished = (id: number) => props.wishlist.some((item) => item.id === id)
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase('ja-JP')
const filtered = computed(() => props.products.filter((item) =>
  (!props.wishedOnly || wished(item.id)) && (category.value === 'すべて' || categoryLabel(item.category) === category.value) &&
  normalize(`${item.name} ${item.description}`).includes(normalize(search.value.trim())))
  .sort((a, b) => sort.value === 'low' ? a.price - b.price : sort.value === 'high' ? b.price - a.price : b.id - a.id))
function hideBrokenImage(event: Event) { if (event.target instanceof HTMLImageElement) event.target.style.visibility = 'hidden' }
</script>
<template>
  <section v-if="!wishedOnly" class="hero">
    <div><p class="eyebrow">暮らしに、小さなときめきを</p><h1>お気に入りと出会う場所。<br />毎日を、少し心地よく。</h1><p class="hero-copy">長く大切にしたくなるものを集めました。<br />日常に寄り添う、小さな楽しみを見つけてください。</p><a class="primary" href="#collection">商品を見る ↗</a></div>
    <div class="hero-art" aria-hidden="true"><div class="circle"></div><div class="vase">✿</div><div class="art-caption">a little joy<br />for your everyday.</div></div>
  </section>
  <section id="collection" class="collection">
    <div class="section-heading"><div><p class="eyebrow">{{ wishedOnly ? 'お気に入り' : '商品一覧' }}</p><h2>{{ wishedOnly ? 'お気に入りの商品' : '今日のおすすめ' }}</h2></div><label class="search"><span class="sr-only">商品を検索</span><input v-model="search" type="search" placeholder="お探しの商品を入力" /></label></div>
    <div class="filters"><div class="category-list"><button v-for="item in categories" :key="item" :aria-pressed="category === item" :class="{ active: category === item }" @click="category = item">{{ item }}</button></div><label><span class="sr-only">商品の並び順</span><select v-model="sort"><option value="latest">新着順</option><option value="low">価格が安い順</option><option value="high">価格が高い順</option></select></label></div>
    <p class="muted small">{{ filtered.length }}件の商品</p>
    <div v-if="filtered.length" class="product-grid">
      <article v-for="product in filtered" :key="product.id" class="product-card">
        <div class="product-visual" :class="{ fashion: categoryLabel(product.category) === 'ファッション', digital: categoryLabel(product.category) === 'デジタル' }">
          <button class="image-button" @click="$emit('detail', product)" :aria-label="`${product.name} の詳細を見る`"><img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy" referrerpolicy="no-referrer" @error="hideBrokenImage" /><span v-else class="emoji">{{ product.emoji }}</span><small>日常を彩るアイテム</small></button>
          <button class="wish-button" :class="{ selected: wished(product.id) }" :aria-label="`${product.name} をお気に入りに追加`" :aria-pressed="wished(product.id)" :disabled="busy" @click="$emit('wish', product)">{{ wished(product.id) ? '♥' : '♡' }}</button>
          <span v-if="product.stock === 0" class="sold-out">在庫切れ</span>
        </div>
        <p class="product-meta">{{ categoryLabel(product.category) }} · 在庫 {{ product.stock }}個</p><button class="product-title" @click="$emit('detail', product)">{{ product.name }}</button><p class="description">{{ product.description }}</p>
        <div class="product-bottom"><strong>{{ money(product.price) }}</strong><button class="secondary" :disabled="busy || product.stock === 0" @click="$emit('add', product)">{{ product.stock ? 'カートに追加' : '在庫切れ' }}</button></div>
      </article>
    </div>
    <div v-else class="empty surface"><span>⌕</span><h3>商品が見つかりませんでした。</h3><p>検索条件を変更するか、お気に入りに商品を追加してください。</p></div>
  </section>
</template>
