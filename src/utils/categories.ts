// Compatibility labels for categories saved before the Japanese storefront migration.
const legacy: Record<string, string> = { '리빙': '暮らし・雑貨', '패션': 'ファッション', '디지털': 'デジタル' }
export const categoryLabel = (value: string) => legacy[value] || value
