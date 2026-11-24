import { createRouter, createWebHistory } from 'vue-router'
import { useShop } from '../composables/useShop'
import CatalogView from '../views/CatalogView.vue'
import AuthView from '../views/AuthView.vue'
import CartView from '../views/CartView.vue'
import OrdersView from '../views/OrdersView.vue'
import AccountView from '../views/AccountView.vue'
import AdminView from '../views/AdminView.vue'
import ProductView from '../views/ProductView.vue'
import MessageView from '../views/MessageView.vue'

declare module 'vue-router' {
  interface RouteMeta { requiresAuth?: boolean; adminOnly?: boolean; title?: string }
}
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'shop', component: CatalogView, meta: { title: 'すべての商品' }, children: [
      { path: 'products/:id(\\d+)', name: 'product', component: ProductView, meta: { title: '商品詳細' } },
    ] },
    { path: '/login', name: 'login', component: AuthView, meta: { title: 'ログイン' } },
    { path: '/register', name: 'register', component: AuthView, meta: { title: '新規登録' } },
    { path: '/favorites', name: 'wishlist', component: CatalogView, meta: { requiresAuth: true, title: 'お気に入り' } },
    { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true, title: 'カート' } },
    { path: '/orders', name: 'orders', component: OrdersView, meta: { requiresAuth: true, title: '注文履歴' } },
    { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true, title: 'マイページ' } },
    { path: '/admin/products', name: 'admin', component: AdminView, meta: { requiresAuth: true, adminOnly: true, title: '商品管理' } },
    { path: '/forbidden', name: 'forbidden', component: MessageView, props: { title: 'アクセス権限がありません。', message: '管理者アカウントでログインしてください。' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: MessageView, props: { title: 'ページが見つかりません。', message: 'URLをご確認ください。' } },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.name === 'product' || from.name === 'product') return false
    return savedPosition || { top: 0 }
  },
})
router.beforeEach(async (to) => {
  const shop = useShop()
  await shop.start()
  if (to.meta.requiresAuth && !shop.user.value) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.adminOnly && shop.user.value?.role !== 'ADMIN') return { name: 'forbidden' }
})
router.afterEach((to) => { document.title = `${to.meta.title || 'ストア'} | ソソマーケット` })

/** Accept only routes in this application, never an external return URL. */
export function loginDestination(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  const target = router.resolve(value)
  return ['login', 'register', 'not-found'].includes(String(target.name)) ? '/' : target.fullPath
}
