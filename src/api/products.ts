import { api } from './http'
import type { Product } from '../types/api'
export const getProducts = () => api<Product[]>('/products')
