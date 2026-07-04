import { render, screen } from '@testing-library/react'
import { OutputPanel } from '@/components/OutputPanel'
import type { LineResult } from '@/domain/change'

function ok(lineNumber: number, change: string): LineResult {
  return { lineNumber, input: 'x,y', status: 'ok', change, error: null }
}

test('empty state reads No output yet', () => {
  render(<OutputPanel results={null} failure={null} />)
  expect(screen.getByText('No output yet')).toBeInTheDocument()
})

test('ok rows show the count list and denomination tokens', () => {
  render(<OutputPanel results={[ok(1, '3 quarters,1 dime,3 pennies')]} failure={null} />)

  expect(screen.getByText('3 quarters,1 dime,3 pennies')).toBeInTheDocument()
  expect(screen.getByLabelText('3 × 25¢')).toBeInTheDocument()
  expect(screen.getByLabelText('1 × 10¢')).toBeInTheDocument()
  expect(screen.getByLabelText('3 × 1¢')).toBeInTheDocument()
})

test('bill change renders bill tokens', () => {
  render(<OutputPanel results={[ok(1, '2 hundred dollar bills,1 dollar')]} failure={null} />)

  expect(screen.getByLabelText('2 × $100')).toBeInTheDocument()
  expect(screen.getByLabelText('1 × $1')).toBeInTheDocument()
})

test('no change rows show the text without tokens', () => {
  render(<OutputPanel results={[ok(1, 'no change')]} failure={null} />)

  expect(screen.getByText('no change')).toBeInTheDocument()
  expect(screen.queryAllByLabelText(/×/)).toHaveLength(0)
})

test('error rows read Line N: message', () => {
  const entry: LineResult = {
    lineNumber: 2,
    input: 'bogus,x',
    status: 'error',
    change: null,
    error: "invalid amount: 'bogus'",
  }
  render(<OutputPanel results={[ok(1, '3 pennies'), entry]} failure={null} />)

  expect(screen.getByText("Line 2: invalid amount: 'bogus'")).toBeInTheDocument()
})

test('a gateway failure renders as an alert instead of rows', () => {
  render(<OutputPanel results={null} failure="backend unreachable" />)

  expect(screen.getByRole('alert')).toHaveTextContent('backend unreachable')
  expect(screen.queryByText('No output yet')).not.toBeInTheDocument()
})
