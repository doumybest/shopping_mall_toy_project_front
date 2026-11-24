<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop'
import AccountPanel from '../components/AccountPanel.vue'
const { user, points } = useShop()
const router = useRouter()
</script>
<template><AccountPanel v-if="user" :user="user" :points="points" /></template>
