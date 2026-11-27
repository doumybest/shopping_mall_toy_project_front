<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { money, number } from '../utils/format'
import type { CartItem, Member, CheckoutInput, Coupon } from '../types/api'
const props = defineProps<{ cart: CartItem[]; user: Member; busy: boolean; coupons: Coupon[]; checkout: (body: CheckoutInput) => Promise<boolean> }>()
defineEmits<{ change: [productId: number, quantity: number]; shop: [] }>()
const form = reactive<Omit<CheckoutInput, 'requestKey'>>({ recipient: '', phone: '', address: '', pointsUsed: 0, paymentMethod: 'MOCK_CARD' })
const consent = ref(false)
const requestKey = ref(crypto.randomUUID())
const couponEventId = ref<number | undefined>()
const subtotal = computed(() => props.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))
const coupon = computed(() => props.coupons.find(item => item.eventId === couponEventId.value))
const discount = computed(() => Math.min(subtotal.value, coupon.value?.discount ?? 0))
const maxPoints = computed(() => Math.min(Math.max(0, props.user.points), subtotal.value - discount.value))
const payable = computed(() => Math.max(0, subtotal.value - discount.value - (Number(form.pointsUsed) || 0)))
watch(maxPoints, max => { if (form.pointsUsed > max) form.pointsUsed = max })
watch(coupon, selected => { if (!selected) couponEventId.value = undefined })
const invalidCart = computed(() => props.cart.some((item) => !item.product.active || item.product.stock < item.quantity))
async function send() {
  if (await props.checkout({ ...form, couponEventId: coupon.value?.eventId, pointsUsed: Number(form.pointsUsed), requestKey: requestKey.value })) requestKey.value = crypto.randomUUID()
}
</script>
<template>
  <div class="page-title"><p class="eyebrow">ショッピングカート</p><h1>カート・ご注文</h1><p class="muted">カートの商品はアカウントに保存されます。</p></div>
  <div v-if="!cart.length" class="empty surface"><span>🛍</span><h2>カートは空です。</h2><button class="primary" @click="$emit('shop')">商品を見る</button></div>
  <div v-else class="checkout-layout">
    <section class="surface cart-items"><h2>カートの商品</h2>
      <article v-for="item in cart" :key="item.product.id" class="cart-row"><div class="mini-visual">{{ item.product.emoji }}</div><div class="cart-item-info"><h3>{{ item.product.name }}</h3><p>{{ money(item.product.price) }}</p><p v-if="!item.product.active || item.product.stock < item.quantity" class="inline-error">販売終了または在庫不足です。数量を変更するか、カートから削除してください。</p><div class="quantity"><button :disabled="busy || item.quantity <= 1" :aria-label="`${item.product.name} の数量を減らす`" @click="$emit('change', item.product.id, item.quantity - 1)">−</button><span>{{ item.quantity }}</span><button :disabled="busy || item.quantity >= Math.min(99, item.product.stock)" :aria-label="`${item.product.name} の数量を増やす`" @click="$emit('change', item.product.id, item.quantity + 1)">+</button></div></div><div class="cart-row-end"><strong>{{ money(item.product.price * item.quantity) }}</strong><button class="text-button" :disabled="busy" @click="$emit('change', item.product.id, 0)">削除</button></div></article>
    </section>
    <form class="surface stack checkout-form" @submit.prevent="send"><h2>ご注文情報</h2>
      <label>お届け先氏名<input v-model="form.recipient" required maxlength="50" autocomplete="shipping name" /></label>
      <label>電話番号<input v-model="form.phone" type="tel" required minlength="8" maxlength="30" autocomplete="shipping tel" placeholder="090-1234-5678" /></label>
      <label>お届け先住所<textarea v-model="form.address" required minlength="5" maxlength="300" autocomplete="shipping street-address" placeholder="郵便番号・都道府県・市区町村・番地・建物名" /></label>
      <label v-if="coupons.length"><span id="checkout-coupon-label">クーポン</span><select v-model="couponEventId" aria-labelledby="checkout-coupon-label">
        <option :value="undefined">利用しない</option>
        <option v-for="item in coupons" :key="item.eventId" :value="item.eventId">{{ item.title }} ({{ money(item.discount) }}引き・{{ item.expiresAt.slice(0, 16).replace('T', ' ') }} JSTまで)</option>
      </select></label>
      <label>利用ポイント <small>利用可能 {{ number(maxPoints) }} P</small><div class="input-row"><input v-model.number="form.pointsUsed" type="number" min="0" :max="maxPoints" step="1" required /><button type="button" class="secondary" @click="form.pointsUsed = maxPoints">すべて使う</button></div></label>
      <label>テスト決済方法<select v-model="form.paymentMethod"><option value="MOCK_CARD">クレジットカード（テスト）</option><option value="MOCK_PAY">スマートフォン決済（テスト）</option></select></label>
      <div class="receipt"><div><span>商品小計</span><strong>{{ money(subtotal) }}</strong></div><div v-if="discount"><span>クーポン割引</span><span>−{{ money(discount) }}</span></div><div><span>ポイント利用</span><span>−{{ money(form.pointsUsed) }}</span></div><div><span>送料</span><span>無料</span></div><div class="receipt-total"><span>テスト決済金額</span><strong>{{ money(payable) }}</strong></div><p class="small muted">決済完了後 {{ number(Math.floor(payable / 100)) }} P 獲得 · 決済金額の1%</p></div>
      <div class="test-notice">テスト専用の決済です。カード・口座情報の入力や実際の請求はありません。PayPayなどの外部決済サービスには接続していません。</div>
      <label class="checkbox"><input v-model="consent" type="checkbox" required />商品・お届け先・テスト決済であることを確認しました。</label>
      <button class="primary" :disabled="busy || !consent || invalidCart">{{ busy ? '注文処理中…' : 'テスト決済で注文する' }}</button>
    </form>
  </div>
</template>
