<script setup lang="ts">
import { date, number } from '../utils/format'
import type { Member, PointEntry } from '../types/api'
defineProps<{ user: Member; points: PointEntry[] }>()
const labels = { EARN: '購入による獲得', USE: '注文で利用', RESTORE: '利用ポイント返還', REVOKE: 'キャンセルによる獲得取消' }
</script>
<template>
  <div class="page-title"><p class="eyebrow">マイページ</p><h1>{{ user.name }}様のマイページ</h1><p class="muted">{{ user.email }}</p></div>
  <section class="point-banner"><div><p>保有ポイント</p><strong>{{ number(user.points) }} <small>P</small></strong></div><p>お支払額の1%を還元<br />1ポイント＝1円として利用</p></section>
  <p v-if="user.points < 0" class="test-notice">キャンセルした注文の獲得ポイントが使用済みのため、残高がマイナスになっています。今後の獲得分から精算し、残高がプラスになると利用できます。</p>
  <section class="surface"><h2>ポイント履歴</h2><p v-if="!points.length" class="empty">購入後にポイント履歴を確認できます。</p><div v-else class="table-scroll"><table><thead><tr><th>日時</th><th>内容</th><th>増減</th><th>更新後残高</th></tr></thead><tbody><tr v-for="entry in points" :key="entry.id"><td>{{ date(entry.createdAt) }}</td><td>{{ labels[entry.kind] }} · 注文 #{{ entry.orderId }}</td><td :class="entry.amount > 0 ? 'positive' : 'negative'">{{ entry.amount > 0 ? '+' : '' }}{{ number(entry.amount) }} P</td><td>{{ number(entry.balanceAfter) }} P</td></tr></tbody></table></div></section>
</template>
