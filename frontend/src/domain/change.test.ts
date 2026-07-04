import { GatewayError } from '@/domain/change'
import type { ChangeGateway, LineResult } from '@/domain/change'

test('a fake gateway satisfies the interface', async () => {
  const fake: ChangeGateway = {
    async submitLines(lines): Promise<LineResult[]> {
      return lines.map((input, index) => ({
        lineNumber: index + 1,
        input,
        status: 'ok',
        change: '3 pennies',
        error: null,
      }))
    },
  }
  const results = await fake.submitLines(['1.97,2.00'], { currency: 'USD', divisor: 3, seed: 42 })
  expect(results).toHaveLength(1)
  expect(results[0]).toEqual({
    lineNumber: 1,
    input: '1.97,2.00',
    status: 'ok',
    change: '3 pennies',
    error: null,
  })
})

test('an error entry is expressible', () => {
  const entry: LineResult = {
    lineNumber: 2,
    input: 'bogus,x',
    status: 'error',
    change: null,
    error: "invalid amount: 'bogus'",
  }
  expect(entry.status).toBe('error')
})

test('GatewayError carries a message and is an Error', () => {
  const failure = new GatewayError('backend unreachable')
  expect(failure).toBeInstanceOf(Error)
  expect(failure.name).toBe('GatewayError')
  expect(failure.message).toBe('backend unreachable')
})
