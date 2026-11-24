<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop'
import AdminPanel from '../components/AdminPanel.vue'
const { user, products, busy, saveProduct, deleteProduct } = useShop()
const router = useRouter()
</script>
<template><AdminPanel v-if="user?.role === 'ADMIN'" :products="products" :busy="busy" :save="saveProduct" @delete="deleteProduct" /></template>
