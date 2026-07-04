import { centsToAmount, parseAmountToCents, randomOwedAmount } from '@/utils/money'

describe('parseAmountToCents', () => {
  test.each([
    ['2.13', 213],
    ['3', 300],
    ['0.05', 5],
    ['10.5', 1050],
    ['0', 0],
    [' 2.12 ', 212],
  ])('parses %s to %i cents', (text, cents) => {
    expect(parseAmountToCents(text)).toBe(cents)
  })

  test.each([['abc'], ['-1'], ['1.234'], [''], ['   '], ['1,00'], ['$2'], ['1e2']])(
    'rejects %s',
    (text) => {
      expect(parseAmountToCents(text)).toBeNull()
    },
  )
})

describe('centsToAmount', () => {
  test.each([
    [0, '0.00'],
    [3, '0.03'],
    [1050, '10.50'],
    [123456, '1234.56'],
  ])('formats %i as %s', (cents, text) => {
    expect(centsToAmount(cents)).toBe(text)
  })
})

describe('randomOwedAmount', () => {
  test('lowest random value gives one cent', () => {
    expect(randomOwedAmount(() => 0)).toBe('0.01')
  })

  test('midpoint random value', () => {
    expect(randomOwedAmount(() => 0.5)).toBe('50.00')
  })

  test('highest random value stays under one hundred dollars', () => {
    expect(randomOwedAmount(() => 0.9999999)).toBe('99.99')
  })

  test('always produces a parseable amount', () => {
    for (let step = 0; step < 20; step += 1) {
      const amount = randomOwedAmount(() => step / 20)
      expect(parseAmountToCents(amount)).not.toBeNull()
    }
  })
})
