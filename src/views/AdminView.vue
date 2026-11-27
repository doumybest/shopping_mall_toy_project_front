<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useShop } from '../composables/useShop'
import AdminPanel from '../components/AdminPanel.vue'
import AdminEvents from '../components/AdminEvents.vue'
import AdminShipments from '../components/AdminShipments.vue'
const { user, products, busy, saveProduct, deleteProduct } = useShop()
const route = useRoute()
const section = ref<'products' | 'events' | 'shipping'>(route.query.event ? 'events' : 'products')
</script>
<template>
  <template v-if="user?.role === 'ADMIN'">
    <nav class="admin-sections" aria-label="管理メニュー">
      <button type="button" class="secondary" :aria-pressed="section === 'products'" :disabled="busy" @click="section = 'products'">商品</button>
      <button type="button" class="secondary" :aria-pressed="section === 'events'" :disabled="busy" @click="section = 'events'">イベント</button>
      <button type="button" class="secondary" :aria-pressed="section === 'shipping'" :disabled="busy" @click="section = 'shipping'">配送</button>
    </nav>
    <AdminPanel v-if="section === 'products'" :products="products" :busy="busy" :save="saveProduct" @delete="deleteProduct" />
    <AdminEvents v-else-if="section === 'events'" :event-id="Number(route.query.event)" />
    <AdminShipments v-else />
  </template>
</template>

<style scoped>
.admin-sections { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.admin-sections button[aria-pressed="true"] { outline: 2px solid currentColor; outline-offset: -2px; }
</style>
