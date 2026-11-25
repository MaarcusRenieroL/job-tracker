export function formatCurrency(amount: number | undefined, currency: string) {
  if (amount === undefined || Number.isNaN(amount)) return "—"
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency.toUpperCase()}`
  }
}

export function formatRelativeDays(dateStr: string) {
  const today = new Date()
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const parts = dateStr.slice(0, 10).split("-").map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr
  const targetUtc = Date.UTC(parts[0], parts[1] - 1, parts[2])
  const diff = Math.round((targetUtc - todayUtc) / 86_400_000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  if (diff > 1 && diff <= 30) return `In ${diff}d`
  if (diff < -1 && diff >= -30) return `${Math.abs(diff)}d ago`
  return dateStr.slice(0, 10)
}
