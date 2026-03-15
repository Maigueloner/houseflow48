export function getCurrencySymbol(currency: string | null | undefined): string {
  if (currency === 'THB') return '฿'
  return '€'
}
