<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'
import { useShop } from './composables/useShop'
import { number } from './utils/format'
import ActionPopup from './components/ActionPopup.vue'
const { user, products, authenticationRequired, busy, loading, error, notice, popup, cartCount, start, logout } = useShop()
const route = useRoute()
const router = useRouter()
watch(() => route.fullPath, () => { popup.value = null })
const navItems = computed(() => [
  { key: 'shop', label: 'すべての商品' }, { key: 'wishlist', label: 'お気に入り' },
  { key: 'orders', label: '注文履歴' }, { key: 'account', label: 'マイページ' },
  ...(user.value?.role === 'ADMIN' ? [{ key: 'admin', label: '商品管理' }] : []),
])
function navigate(name: string) { if (!busy.value) void router.push({ name }) }
watch(authenticationRequired, () => {
  if (route.name !== 'login' && route.name !== 'register') void router.push({ name: 'login', query: { redirect: route.fullPath } })
})
async function signOut() { await logout(); if (!user.value) await router.push('/') }
</script>
<template>
  <ActionPopup v-if="popup" :feedback="popup" @close="popup = null" />
  <div class="announcement">デモストア · テスト決済専用 · 実際の請求は発生しません。</div>
  <header class="header wrap"><button class="brand" aria-label="ソソマーケット ホーム" @click="navigate('shop')">soso<span>market.</span></button><span class="header-note">毎日を、少し心地よく</span>
    <div class="header-actions"><template v-if="user"><span class="user-name">{{ user.name }}様 <span class="point-chip">{{ number(user.points) }} P</span></span><button class="text-button" :disabled="busy" @click="signOut">ログアウト</button></template><button v-else class="text-button" :disabled="busy" @click="navigate('login')">ログイン / 新規登録</button><button class="cart-button" :disabled="busy" @click="navigate('cart')">カート <b>{{ cartCount }}</b></button></div>
  </header>
  <div class="nav-border"><nav class="wrap main-nav" aria-label="メインメニュー"><RouterLink v-for="item in navItems" :key="item.key" :to="{ name: item.key }" :class="{ active: route.name === item.key || (item.key === 'shop' && route.name === 'product') }">{{ item.label }}</RouterLink><span class="nav-caption">小さな発見から、心地よい一日へ</span></nav></div>
  <main class="wrap main-content">
    <div v-if="error" class="banner error" role="alert"><span>{{ error }}</span><button aria-label="エラーメッセージを閉じる" @click="error = ''">×</button></div>
    <div v-if="notice" class="banner success" role="status"><span>{{ notice }}</span><button aria-label="お知らせを閉じる" @click="notice = ''">×</button></div>
    <div v-if="loading" class="empty surface" role="status">ストアを読み込んでいます…</div>
    <div v-else-if="!products.length && error && route.name === 'shop'" class="empty surface"><h2>サーバーへの接続をご確認ください。</h2><p>サーバーを起動してから、もう一度お試しください。</p><button class="primary" @click="start(true)">再接続</button></div>
    <RouterView v-else />
  </main>
  <footer class="wrap"><div><span class="brand">soso<span>market.</span></span><p>日常に、ちょうどいい選択を。</p></div><p>デモショッピングサイト<br />テスト注文 · テスト決済 · サンプルデータ</p></footer>
</template>
