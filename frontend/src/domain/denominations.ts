// UI catalog of USD denominations: payment grid entries and the mapping
// from backend change-line names to visual tokens.

export type DenominationKind = 'bill' | 'coin'

export interface UiDenomination {
  id: string
  label: string
  valueCents: number
  kind: DenominationKind
}

const DOLLAR: UiDenomination = { id: 'dollar', label: '$1', valueCents: 100, kind: 'bill' }
const FIVE: UiDenomination = { id: 'five', label: '$5', valueCents: 500, kind: 'bill' }
const TEN: UiDenomination = { id: 'ten', label: '$10', valueCents: 1000, kind: 'bill' }
const TWENTY: UiDenomination = { id: 'twenty', label: '$20', valueCents: 2000, kind: 'bill' }
const FIFTY: UiDenomination = { id: 'fifty', label: '$50', valueCents: 5000, kind: 'bill' }
const HUNDRED: UiDenomination = { id: 'hundred', label: '$100', valueCents: 10000, kind: 'bill' }
const QUARTER: UiDenomination = { id: 'quarter', label: '25¢', valueCents: 25, kind: 'coin' }
const DIME: UiDenomination = { id: 'dime', label: '10¢', valueCents: 10, kind: 'coin' }
const NICKEL: UiDenomination = { id: 'nickel', label: '5¢', valueCents: 5, kind: 'coin' }
const PENNY: UiDenomination = { id: 'penny', label: '1¢', valueCents: 1, kind: 'coin' }

export const USD_PAYMENT_DENOMINATIONS: UiDenomination[] = [
  DOLLAR,
  FIVE,
  TEN,
  TWENTY,
  FIFTY,
  HUNDRED,
  QUARTER,
  DIME,
  NICKEL,
  PENNY,
]

const BY_BACKEND_NAME: Record<string, UiDenomination> = {
  dollar: DOLLAR,
  dollars: DOLLAR,
  'five dollar bill': FIVE,
  'five dollar bills': FIVE,
  'ten dollar bill': TEN,
  'ten dollar bills': TEN,
  'twenty dollar bill': TWENTY,
  'twenty dollar bills': TWENTY,
  'fifty dollar bill': FIFTY,
  'fifty dollar bills': FIFTY,
  'hundred dollar bill': HUNDRED,
  'hundred dollar bills': HUNDRED,
  quarter: QUARTER,
  quarters: QUARTER,
  dime: DIME,
  dimes: DIME,
  nickel: NICKEL,
  nickels: NICKEL,
  penny: PENNY,
  pennies: PENNY,
}

export function denominationForName(name: string): UiDenomination | null {
  return BY_BACKEND_NAME[name] ?? null
}
