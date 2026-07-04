import { USD_PAYMENT_DENOMINATIONS, denominationForName } from '@/domain/denominations'

test('payment grid covers the spec denominations in order', () => {
  expect(USD_PAYMENT_DENOMINATIONS.map((d) => d.label)).toEqual([
    '$1',
    '$5',
    '$10',
    '$20',
    '$50',
    '$100',
    '25¢',
    '10¢',
    '5¢',
    '1¢',
  ])
})

test('bills and coins carry their kind', () => {
  const kinds = Object.fromEntries(USD_PAYMENT_DENOMINATIONS.map((d) => [d.label, d.kind]))
  expect(kinds['$100']).toBe('bill')
  expect(kinds['$1']).toBe('bill')
  expect(kinds['25¢']).toBe('coin')
  expect(kinds['1¢']).toBe('coin')
})

test.each([
  ['dollar', '$1'],
  ['dollars', '$1'],
  ['quarter', '25¢'],
  ['quarters', '25¢'],
  ['dime', '10¢'],
  ['nickel', '5¢'],
  ['penny', '1¢'],
  ['pennies', '1¢'],
  ['five dollar bill', '$5'],
  ['ten dollar bills', '$10'],
  ['twenty dollar bill', '$20'],
  ['fifty dollar bills', '$50'],
  ['hundred dollar bills', '$100'],
])('backend name %s maps to %s', (name, label) => {
  expect(denominationForName(name)?.label).toBe(label)
})

test('unknown names return null', () => {
  expect(denominationForName('two euro coin')).toBeNull()
})
