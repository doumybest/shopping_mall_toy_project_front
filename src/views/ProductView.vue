<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShop } from '../composables/useShop'
import type { Product } from '../types/api'
import ProductDetail from '../components/ProductDetail.vue'
const { products, user, busy, run, error, addToCart } = useShop()
const route = useRoute()
const router = useRouter()
const product = computed(() => products.value.find(item => item.id === Number(route.params.id)))
async function add(item: Product) { await router.push('/'); await addToCart(item) }
</script>
<template>
  <ProductDetail v-if="product" :key="product.id" :product="product" :user="user" :busy="busy" :run="run" :error-message="error" @close="router.push('/')" @add="add" />
  <section v-else class="surface empty" role="alert"><h1>商品が見つかりません。</h1><button class="primary" @click="router.push('/')">すべての商品へ</button></section>
</template>
