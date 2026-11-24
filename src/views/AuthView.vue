<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { loginDestination } from '../router'
import { useShop } from '../composables/useShop'
import type { AuthInput } from '../types/api'
import AuthPanel from '../components/AuthPanel.vue'
const { busy, login } = useShop()
const route = useRoute()
const router = useRouter()
async function submit(form: AuthInput, registering: boolean) {
  const destination = loginDestination(route.query.redirect)
  const ok = await login(form, registering)
  if (ok) await router.replace(destination)
  return ok
}
</script>
<template><AuthPanel :key="String(route.name)" :busy="busy" :submit="submit" /></template>
