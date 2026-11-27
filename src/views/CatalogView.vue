<script setup lang="ts">
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useShop } from '../composables/useShop'
import ProductCatalog from '../components/ProductCatalog.vue'
import EventBanners from '../components/EventBanners.vue'
const { products, wishlist, busy, events, addToCart, toggleWish } = useShop()
const route = useRoute()
const router = useRouter()
</script>
<template>
  <EventBanners v-if="route.name === 'shop' && events.length" :events="events" />
  <ProductCatalog :products="products" :wishlist="wishlist" :busy="busy" :wished-only="route.name === 'wishlist'" @add="addToCart" @wish="toggleWish" @detail="product => router.push({ name: 'product', params: { id: product.id } })" />
  <RouterView />
</template>
