import { computed, ref } from 'vue'
import { ApiError, api, refreshCsrf } from '../api/http'
import type { PopupPosition } from '../utils/popupPosition'

import type { Member, Product, CartItem, Order, PointEntry, AuthInput, CheckoutInput, ProductForm, Coupon, EventBanner } from '../types/api'

function createShop() {
  const user = ref<Member | null>(null)
  const products = ref<Product[]>([])
  const cart = ref<CartItem[]>([])
  const wishlist = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const points = ref<PointEntry[]>([])
  const coupons = ref<Coupon[]>([])
  const claimedEventIds = ref<number[]>([])
  const events = ref<EventBanner[]>([])
  const popup = ref<(PopupPosition & { message: string; cart?: boolean; failure?: boolean }) | null>(null)
  const authenticationRequired = ref(0)
  const busy = ref(false)
  const loading = ref(true)
  const error = ref('')
  const notice = ref('')
  const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
  async function loadPrivate() {
    const result = await Promise.all([api<Member>('/auth/me'), api<CartItem[]>('/cart'), api<Product[]>('/wishlist'), api<Order[]>('/orders'), api<PointEntry[]>('/points'), api<Coupon[]>('/coupons'), api<number[]>('/coupons/claimed-events')])
    ;[user.value, cart.value, wishlist.value, orders.value, points.value, coupons.value, claimedEventIds.value] = result
  }
  function clearPrivate() { user.value = null; cart.value = []; wishlist.value = []; orders.value = []; points.value = []; coupons.value = []; claimedEventIds.value = [] }
  async function refresh() {
    const result = await Promise.all([api<Product[]>('/products'), api<EventBanner[]>('/events')])
    ;[products.value, events.value] = result
    if (user.value) await loadPrivate()
  }
  let initialization: Promise<void> | undefined
  function start(retry = false) { if (retry) initialization = undefined; return initialization ??= initialize() }
  async function initialize() {
    loading.value = true; error.value = ''
    try {
      await refreshCsrf()
      try { user.value = await api<Member>('/auth/me') } catch (ex) { if ((ex instanceof ApiError ? ex.status : 0) !== 401) throw ex }
      await refresh()
    } catch (ex) { error.value = (ex instanceof Error ? ex.message : '処理に失敗しました。') }
    finally { loading.value = false }
  }
  async function run(action: () => Promise<void>, message = '', feedback?: PopupPosition & { cart?: boolean }) {
    if (busy.value) return false
    busy.value = true; error.value = ''; notice.value = ''; popup.value = null
    try {
      await action()
      if (feedback) popup.value = { ...feedback, message }
      else notice.value = message
      return true
    }
    catch (ex) {
      if ((ex instanceof ApiError ? ex.status : 0) === 401) { clearPrivate(); authenticationRequired.value++ }
      const message = ex instanceof Error ? ex.message : '処理に失敗しました。'
      if (feedback) popup.value = { ...feedback, cart: false, failure: true, message }
      else error.value = message
      return false
    } finally { busy.value = false }
  }
  function requireLogin() {
    if (user.value) return true
    authenticationRequired.value++; notice.value = 'ログインしてからご利用ください。'; return false
  }
  async function login(form: AuthInput, registering: boolean) {
    return run(async () => {
      if (registering) await api('/auth/register', { method: 'POST', body: form })
      await api('/auth/login', { method: 'POST', form: true, body: { email: form.email.trim().toLowerCase(), password: form.password } })
      await refreshCsrf()
      await loadPrivate()
    }, registering ? '会員登録が完了しました。ようこそ！' : 'ログインしました。')
  }
  async function logout() {
    await run(async () => { await api('/auth/logout', { method: 'POST' }); clearPrivate(); await refreshCsrf() }, 'ログアウトしました。')
  }
  async function addToCart(product: Product, position: PopupPosition) {
    if (!requireLogin()) return
    const quantity = (cart.value.find((item) => item.product.id === product.id)?.quantity || 0) + 1
    await run(async () => { await api('/cart', { method: 'PUT', body: { productId: product.id, quantity } }); cart.value = await api<CartItem[]>('/cart') }, 'カートに追加しました。', { ...position, cart: true })
  }
  async function updateCart(productId: number, quantity: number) {
    await run(async () => {
      if (quantity === 0) await api(`/cart/${productId}`, { method: 'DELETE' })
      else await api('/cart', { method: 'PUT', body: { productId, quantity } })
      cart.value = await api<CartItem[]>('/cart')
    })
  }
  async function toggleWish(product: Product) {
    if (!requireLogin()) return
    await run(async () => {
      await api(`/wishlist/${product.id}`, { method: wishlist.value.some((item) => item.id === product.id) ? 'DELETE' : 'PUT' })
      wishlist.value = await api<Product[]>('/wishlist')
    })
  }
  async function checkout(body: CheckoutInput) {
    return run(async () => {
      await api('/orders/checkout', { method: 'POST', body })
      await refresh()
    }, 'テスト決済が完了しました。実際の請求は発生していません。')
  }
  async function claimCoupon(eventId: number, position: PopupPosition) {
    if (!requireLogin()) return
    await run(async () => {
      try {
        await api(`/events/${eventId}/coupon`, { method: 'POST' })
      } catch (ex) {
        if (ex instanceof ApiError && ex.status === 409) claimedEventIds.value = await api<number[]>('/coupons/claimed-events')
        throw ex
      }
      claimedEventIds.value = [...claimedEventIds.value, eventId]
      coupons.value = await api<Coupon[]>('/coupons')
    }, 'クーポンを受け取りました。', position)
  }
  async function cancel(orderId: number) {
    await run(async () => { await api(`/orders/${orderId}/cancel`, { method: 'POST' }); await refresh() }, '注文をキャンセルし、在庫とポイントを更新しました。')
  }
  async function saveProduct(form: ProductForm) {
    return run(async () => {
      const { id, ...body } = form
      await api(id ? `/admin/products/${id}` : '/admin/products', { method: id ? 'PUT' : 'POST', body })
      await refresh()
    }, '商品を保存しました。')
  }
  async function deleteProduct(id: number) {
    await run(async () => { await api(`/admin/products/${id}`, { method: 'DELETE' }); await refresh() }, '商品の販売を終了しました。過去の注文履歴は保持されます。')
  }
  return { user, products, cart, wishlist, orders, points, coupons, claimedEventIds, events, authenticationRequired, busy, loading, error, notice, popup, cartCount,
    start, refresh, run, requireLogin, login, logout, addToCart, updateCart, toggleWish, checkout, claimCoupon, cancel, saveProduct, deleteProduct }
}

const shop = createShop()
export function useShop() { return shop }
