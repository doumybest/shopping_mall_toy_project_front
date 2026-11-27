import type { ShippingStatus } from '../types/api'

export const shippingLabels: Record<ShippingStatus, string> = {
  PREPARING: '発送準備中',
  SHIPPED: '発送済み',
  DELIVERED: '配達完了',
}
