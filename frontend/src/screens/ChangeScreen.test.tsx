import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangeScreen } from '@/screens/ChangeScreen'
import { GatewayError } from '@/domain/change'
import type { ChangeGateway, LineResult } from '@/domain/change'

const README_TEXT = '2.12,3.00\n1.97,2.00\n3.33,5.00'

const README_RESULTS: LineResult[] = [
  {
    lineNumber: 1,
    input: '2.12,3.00',
    status: 'ok',
    change: '3 quarters,1 dime,3 pennies',
    error: null,
  },
  { lineNumber: 2, input: '1.97,2.00', status: 'ok', change: '3 pennies', error: null },
  {
    lineNumber: 3,
    input: '3.33,5.00',
    status: 'ok',
    change: '1 dollar,1 quarter,3 dimes,2 nickels,2 pennies',
    error: null,
  },
]

function makeGateway(results: LineResult[]): ChangeGateway {
  return { submitLines: vi.fn().mockResolvedValue(results) }
}

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText(/transactions/i), { target: { value } })
}

test('submitting pasted lines renders one change line per input', async () => {
  const gateway = makeGateway(README_RESULTS)
  render(<ChangeScreen gateway={gateway} />)

  setInput(README_TEXT)
  await userEvent.click(screen.getByRole('button', { name: /make change/i }))

  expect(await screen.findByText('3 quarters,1 dime,3 pennies')).toBeInTheDocument()
  expect(screen.getByText('3 pennies')).toBeInTheDocument()
  expect(screen.getByText('1 dollar,1 quarter,3 dimes,2 nickels,2 pennies')).toBeInTheDocument()
  expect(gateway.submitLines).toHaveBeenCalledWith(['2.12,3.00', '1.97,2.00', '3.33,5.00'])
})

test('per-line error entries render as error rows', async () => {
  const gateway = makeGateway([
    { lineNumber: 1, input: 'bogus,x', status: 'error', change: null, error: "invalid amount: 'bogus'" },
    { lineNumber: 2, input: '1.97,2.00', status: 'ok', change: '3 pennies', error: null },
  ])
  render(<ChangeScreen gateway={gateway} />)

  setInput('bogus,x\n1.97,2.00')
  await userEvent.click(screen.getByRole('button', { name: /make change/i }))

  const errorCell = await screen.findByText("invalid amount: 'bogus'")
  expect(errorCell.closest('tr')).toHaveClass('change-screen__row--error')
  expect(screen.getByText('3 pennies')).toBeInTheDocument()
})

test('submit is disabled while the input has no non-blank lines', () => {
  render(<ChangeScreen gateway={makeGateway([])} />)

  const button = screen.getByRole('button', { name: /make change/i })
  expect(button).toBeDisabled()

  setInput('   \n\n  ')
  expect(button).toBeDisabled()

  setInput('1.97,2.00')
  expect(button).toBeEnabled()
})

test('blank lines are dropped before reaching the gateway', async () => {
  const gateway = makeGateway([README_RESULTS[1]])
  render(<ChangeScreen gateway={gateway} />)

  setInput('\n  1.97,2.00  \n\n')
  await userEvent.click(screen.getByRole('button', { name: /make change/i }))

  await screen.findByText('3 pennies')
  expect(gateway.submitLines).toHaveBeenCalledWith(['1.97,2.00'])
})

test('very long input renders every result row', async () => {
  const many: LineResult[] = Array.from({ length: 500 }, (_, index) => ({
    lineNumber: index + 1,
    input: '1.97,2.00',
    status: 'ok',
    change: '3 pennies',
    error: null,
  }))
  render(<ChangeScreen gateway={makeGateway(many)} />)

  setInput(Array(500).fill('1.97,2.00').join('\n'))
  await userEvent.click(screen.getByRole('button', { name: /make change/i }))

  await screen.findAllByText('3 pennies')
  expect(screen.getAllByRole('row')).toHaveLength(501)
})

test('gateway failure shows a message instead of results', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi.fn().mockRejectedValue(new GatewayError('backend unreachable')),
  }
  render(<ChangeScreen gateway={gateway} />)

  setInput('1.97,2.00')
  await userEvent.click(screen.getByRole('button', { name: /make change/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('backend unreachable')
})

test('picking a file fills the input', async () => {
  render(<ChangeScreen gateway={makeGateway([])} />)

  const file = new File([README_TEXT], 'input.txt', { type: 'text/plain' })
  await userEvent.upload(screen.getByLabelText(/load file/i), file)

  await waitFor(() => {
    expect(screen.getByLabelText(/transactions/i)).toHaveValue(README_TEXT)
  })
})
