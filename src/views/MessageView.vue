<script setup lang="ts">
import { RouterLink } from 'vue-router'
defineProps<{ title: string; message: string }>()
</script>
<template><section class="surface empty"><h1>{{ title }}</h1><p>{{ message }}</p><RouterLink class="primary" to="/">すべての商品へ</RouterLink></section></template>
