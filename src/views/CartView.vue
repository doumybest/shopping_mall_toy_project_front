<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop'
import type { CheckoutInput } from '../types/api'
import CartPanel from '../components/CartPanel.vue'
const { cart, user, busy, checkout, updateCart } = useShop()
const router = useRouter()
async function submit(body: CheckoutInput) { const ok = await checkout(body); if (ok) await router.push({ name: 'orders' }); return ok }
</script>
<template><CartPanel v-if="user" :cart="cart" :user="user" :busy="busy" :checkout="submit" @change="updateCart" @shop="router.push('/')" /></template>
