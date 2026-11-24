export const money = (value: number | null | undefined) => new Intl.NumberFormat('ja-JP', {
  style: 'currency', currency: 'JPY', maximumFractionDigits: 0,
}).format(value ?? 0)
export const number = (value: number | null | undefined) => new Intl.NumberFormat('ja-JP').format(value ?? 0)
export const date = (value: string | null | undefined) => {
  if (!value) return ''
  // Existing naive DB timestamps were stored in Korea/Japan time (both UTC+09:00).
  const instant = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(instant))
}
