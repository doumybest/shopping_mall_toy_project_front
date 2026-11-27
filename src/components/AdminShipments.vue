<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api/http'
import { useShop } from '../composables/useShop'
import type { Shipment, ShippingStatus } from '../types/api'
import { date } from '../utils/format'
import { shippingLabels } from '../utils/shipping'

const { busy, orders, run } = useShop()
const shipments = ref<Shipment[]>([])
const page = ref(0)
const hasNext = ref(false)
const nextStatus: Partial<Record<ShippingStatus, ShippingStatus>> = { PREPARING: 'SHIPPED', SHIPPED: 'DELIVERED' }

function load(nextPage = page.value) {
  return run(async () => {
    const result = await api<{ orders: Shipment[]; hasNext: boolean }>(`/admin/orders?page=${nextPage}`)
    shipments.value = result.orders
    hasNext.value = result.hasNext
    page.value = nextPage
  })
}
onMounted(() => { void load() })

function update(shipment: Shipment) {
  const shippingStatus = nextStatus[shipment.shippingStatus]
  if (!shippingStatus) return
  return run(async () => {
    const updated = await api<Shipment>(`/admin/orders/${shipment.id}/shipping`, {
      method: 'PUT', body: { shippingStatus },
    })
    shipments.value = shipments.value.map(item => item.id === updated.id ? updated : item)
    orders.value = orders.value.map(order => order.id === updated.id
      ? { ...order, status: updated.status, shippingStatus: updated.shippingStatus }
      : order)
  }, '配送状況を更新しました。')
}
</script>

<template>
  <div class="page-title">
    <h1>配送管理</h1>
    <button type="button" class="secondary" :disabled="busy" @click="load()">注文を更新</button>
  </div>
  <p v-if="!shipments.length && !busy">注文はまだありません。</p>
  <div class="stack">
    <article v-for="shipment in shipments" :key="shipment.id" class="surface order-card section-heading">
      <div>
        <h2>注文 #{{ shipment.id }}</h2>
        <time class="small muted">{{ date(shipment.createdAt) }}</time>
        <p>{{ shipment.status === 'CANCELLED' ? 'キャンセル済み' : shippingLabels[shipment.shippingStatus] }}</p>
      </div>
      <button v-if="shipment.status === 'PAID' && shipment.shippingStatus !== 'DELIVERED'" type="button" class="secondary" :disabled="busy" @click="update(shipment)">
        {{ shipment.shippingStatus === 'PREPARING' ? '発送済みにする' : '配達完了にする' }}
      </button>
    </article>
  </div>
  <nav v-if="page || hasNext" class="section-heading" aria-label="注文一覧のページ">
    <button type="button" class="secondary" :disabled="busy || page === 0" @click="load(page - 1)">前へ</button>
    <span>{{ page + 1 }} ページ</span>
    <button type="button" class="secondary" :disabled="busy || !hasNext" @click="load(page + 1)">次へ</button>
  </nav>
</template>
