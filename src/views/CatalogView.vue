<script setup lang="ts">
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useShop } from '../composables/useShop'
import ProductCatalog from '../components/ProductCatalog.vue'
const { products, wishlist, busy, addToCart, toggleWish } = useShop()
const route = useRoute()
const router = useRouter()
</script>
<template>
  <ProductCatalog :products="products" :wishlist="wishlist" :busy="busy" :wished-only="route.name === 'wishlist'" @add="addToCart" @wish="toggleWish" @detail="product => router.push({ name: 'product', params: { id: product.id } })" />
  <RouterView />
</template>
