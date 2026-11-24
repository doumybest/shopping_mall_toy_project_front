<script setup lang="ts">
import { ref } from 'vue'
import { money, number, date } from '../utils/format'
import type { Order } from '../types/api'
defineProps<{ orders: Order[]; busy: boolean }>()
defineEmits<{ cancel: [id: number]; shop: [] }>()
const confirming = ref<number | null>(null)
</script>
<template>
  <div class="page-title"><p class="eyebrow">ご注文履歴</p><h1>注文履歴</h1><p class="muted">テスト決済とキャンセルの履歴を確認できます。</p></div>
  <div v-if="!orders.length" class="empty surface"><h2>ご注文はまだありません。</h2><button class="primary" @click="$emit('shop')">商品を探す</button></div>
  <div class="stack" v-else><article v-for="order in orders" :key="order.id" class="surface order-card">
    <div class="section-heading"><div><span class="badge" :class="{ cancelled: order.status === 'CANCELLED' }">{{ order.status === 'PAID' ? 'テスト決済完了' : 'キャンセル済み' }}</span><h3>注文 #{{ order.id }}</h3><time class="small muted">{{ date(order.createdAt) }}</time></div><strong>{{ money(order.amountPaid) }}</strong></div>
    <ul class="order-lines"><li v-for="line in order.items" :key="line.productId"><span>{{ line.name }} × {{ line.quantity }}</span><strong>{{ money(line.unitPrice * line.quantity) }}</strong></li></ul>
    <div class="order-summary"><p>{{ order.recipient }} · {{ order.phone }}<br />{{ order.address }}</p><p>商品 {{ money(order.subtotal) }} · ポイント利用 {{ number(order.pointsUsed) }} P<br />{{ order.status === 'PAID' ? '獲得' : '獲得取消' }} {{ number(order.pointsEarned) }} P · {{ order.paymentMethod === 'MOCK_CARD' ? 'カード（テスト）' : 'スマートフォン決済（テスト）' }}</p></div>
    <div v-if="order.status === 'PAID'" class="order-actions"><template v-if="confirming === order.id"><span class="small">在庫と利用ポイントを戻し、獲得ポイントを取り消します。</span><button class="danger-button" :disabled="busy" @click="$emit('cancel', order.id); confirming = null">キャンセルを確定</button><button class="secondary" @click="confirming = null">注文を維持</button></template><button v-else class="secondary" :disabled="busy" @click="confirming = order.id">注文をキャンセル</button></div>
  </article></div>
</template>
