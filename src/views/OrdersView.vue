<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useShop } from '../composables/useShop'
import OrdersPanel from '../components/OrdersPanel.vue'
import { api } from '../api/http'
import type { Order } from '../types/api'
const { orders, user, busy, cancel, run, notice } = useShop()
const router = useRouter()
function refreshOrders() { return run(async () => { orders.value = await api<Order[]>('/orders') }, notice.value) }
onMounted(() => { void refreshOrders() })
</script>
<template><OrdersPanel v-if="user" :orders="orders" :busy="busy" @cancel="cancel" @refresh="refreshOrders" @shop="router.push('/')" /></template>
