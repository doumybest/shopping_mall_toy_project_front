/** Backend JSON contracts. Monetary values use JPY. */
export interface Member { id: number; email: string; name: string; role: 'MEMBER' | 'ADMIN'; points: number }
export interface Product { id: number; name: string; category: string; price: number; description: string; emoji: string; imageUrl: string | null; stock: number; active: number }
export type ProductInput = Omit<Product, 'id' | 'active'>
export type ProductForm = ProductInput & { id: number | null }
export interface CartItem { product: Product; quantity: number }
export type PaymentMethod = 'MOCK_CARD' | 'MOCK_PAY'
export interface CheckoutInput { requestKey: string; pointsUsed: number; recipient: string; phone: string; address: string; paymentMethod: PaymentMethod; couponEventId?: number }
export interface OrderLine { productId: number; name: string; unitPrice: number; quantity: number }
export interface Order { id: number; status: 'PAID' | 'CANCELLED'; shippingStatus: ShippingStatus; couponDiscount: number; subtotal: number; pointsUsed: number; amountPaid: number; pointsEarned: number; recipient: string; phone: string; address: string; paymentMethod: PaymentMethod; createdAt: string; items: OrderLine[] }
export type ShippingStatus = 'PREPARING' | 'SHIPPED' | 'DELIVERED'
export type Shipment = Pick<Order, 'id' | 'status' | 'shippingStatus' | 'createdAt'>
export interface ShopEvent { id: number; title: string; description: string; startsAt: string; endsAt: string; discount: number; enabled: boolean; hasImage: boolean }
export type EventBanner = Pick<ShopEvent, 'id' | 'title' | 'description' | 'endsAt' | 'discount' | 'hasImage'>
export type EventInput = Omit<ShopEvent, 'id' | 'hasImage'> & { imageData?: string }
export interface Coupon { eventId: number; title: string; expiresAt: string; discount: number }
export interface PointEntry { id: number; orderId: number; kind: 'EARN' | 'USE' | 'RESTORE' | 'REVOKE'; amount: number; balanceAfter: number; createdAt: string }
export interface Review { id: number; memberId: number; author: string; rating: number; content: string; createdAt: string }
export interface AuthInput { email: string; password: string; name: string }
export interface EmailSent { expiresInSeconds: number; retryAfterSeconds: number }
export interface EmailVerified { validForSeconds: number }
export type RunAction = (action: () => Promise<void>, message?: string) => Promise<boolean>
