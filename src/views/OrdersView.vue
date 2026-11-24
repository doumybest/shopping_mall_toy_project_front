<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop'
import OrdersPanel from '../components/OrdersPanel.vue'
const { orders, user, busy, cancel } = useShop()
const router = useRouter()
</script>
<template><OrdersPanel v-if="user" :orders="orders" :busy="busy" @cancel="cancel" @shop="router.push('/')" /></template>
