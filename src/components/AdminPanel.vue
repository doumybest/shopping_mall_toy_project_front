<script setup lang="ts">
import { reactive, ref } from 'vue'
import { money } from '../utils/format'
import { categoryLabel } from '../utils/categories'
import type { Product, ProductForm } from '../types/api'
const props = defineProps<{ products: Product[]; busy: boolean; save: (form: ProductForm) => Promise<boolean> }>()
defineEmits<{ delete: [id: number] }>()
const blank = (): ProductForm => ({ id: null, name: '', category: '暮らし・雑貨', price: 1000, description: '', emoji: '🛍️', imageUrl: '', stock: 0 })
const form = reactive(blank())
const confirming = ref<number | null>(null)
const editor = ref<HTMLElement | null>(null)
function edit(product: Product) {
  Object.assign(form, blank(), product, { category: categoryLabel(product.category), price: product.price })
  editor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
async function submit() {
  const { id, name, category, price, description, emoji, imageUrl, stock } = form
  if (await props.save({ id, name, category, price: Number(price), description, emoji, imageUrl: imageUrl || '', stock: Number(stock) })) Object.assign(form, blank())
}
</script>
<template>
  <div class="page-title"><p class="eyebrow">ストア管理</p><h1>商品管理</h1><p class="muted">管理者のみ商品の登録・編集・削除を行えます。</p></div>
  <section class="surface"><h2>販売商品 {{ products.length }}件</h2><div class="table-scroll"><table><thead><tr><th>商品</th><th>カテゴリー</th><th>価格</th><th>在庫</th><th>管理</th></tr></thead><tbody><tr v-for="product in products" :key="product.id"><td>{{ product.emoji }} {{ product.name }}</td><td>{{ categoryLabel(product.category) }}</td><td>{{ money(product.price) }}</td><td>{{ product.stock }}</td><td class="table-actions"><button class="secondary" :disabled="busy" @click="edit(product)">編集</button><button v-if="confirming !== product.id" class="text-button negative" :disabled="busy" @click="confirming = product.id">削除</button><template v-else><button class="danger-button" :disabled="busy" @click="$emit('delete', product.id); confirming = null">削除を確定</button><button class="text-button" @click="confirming = null">キャンセル</button></template></td></tr></tbody></table></div></section>
  <section ref="editor" class="surface admin-editor"><div class="section-heading"><h2>{{ form.id ? `商品 #${form.id} 編集` : '商品を新規登録' }}</h2><button class="text-button" @click="Object.assign(form, blank())">入力をリセット</button></div>
    <form class="form-grid" @submit.prevent="submit"><label>商品名<input v-model="form.name" required maxlength="120" /></label><label>カテゴリー<input v-model="form.category" required maxlength="40" list="categories" /><datalist id="categories"><option>暮らし・雑貨</option><option>ファッション</option><option>デジタル</option></datalist></label><label>価格（円）<input v-model.number="form.price" type="number" required min="1" max="100000000" step="1" /></label><label>在庫数（個）<input v-model.number="form.stock" type="number" required min="0" max="1000000" step="1" /></label><label>商品アイコン<input v-model="form.emoji" required maxlength="20" /></label><label>画像URL（任意）<input v-model="form.imageUrl" type="url" pattern="https://.*" maxlength="1000" placeholder="https://…" /></label><label class="full-width">商品説明<textarea v-model="form.description" required maxlength="2000" rows="4" /></label><p class="muted small full-width">削除した商品は販売終了となります。過去の注文・決済履歴は保持されます。</p><button class="primary full-width" :disabled="busy">{{ busy ? '保存中…' : form.id ? '変更を保存' : '商品を登録' }}</button></form>
  </section>
</template>
