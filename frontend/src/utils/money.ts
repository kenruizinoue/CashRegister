// Pure money helpers. Amounts are integer cents everywhere; strings only
// at the UI boundary, mirroring the backend's strict format.

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

export function parseAmountToCents(text: string): number | null {
  const cleaned = text.trim()
  if (!AMOUNT_PATTERN.test(cleaned)) {
    return null
  }
  const [whole, fraction = ''] = cleaned.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0') || '0')
}

export function centsToAmount(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

export function randomOwedAmount(random: () => number = Math.random): string {
  const cents = 1 + Math.floor(random() * 9999)
  return centsToAmount(cents)
}
