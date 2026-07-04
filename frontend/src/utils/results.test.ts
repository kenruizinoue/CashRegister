import { resultText } from '@/utils/results'
import type { LineResult } from '@/domain/change'

function make(overrides: Partial<LineResult>): LineResult {
  return {
    lineNumber: 1,
    input: '1.97,2.00',
    status: 'ok',
    change: '3 pennies',
    error: null,
    ...overrides,
  }
}

test('ok result displays its change', () => {
  expect(resultText(make({}))).toBe('3 pennies')
})

test('error result displays its message', () => {
  expect(resultText(make({ status: 'error', change: null, error: 'invalid amount' }))).toBe(
    'invalid amount',
  )
})

test('missing change on an ok result degrades to empty string', () => {
  expect(resultText(make({ change: null }))).toBe('')
})

test('missing error message on an error result degrades to empty string', () => {
  expect(resultText(make({ status: 'error', change: null, error: null }))).toBe('')
})
