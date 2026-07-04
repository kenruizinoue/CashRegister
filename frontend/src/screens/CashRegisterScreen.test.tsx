import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CashRegisterScreen, SAMPLE_INPUT } from '@/screens/CashRegisterScreen'
import type { ChangeGateway, LineResult } from '@/domain/change'

function ok(lineNumber: number, input: string, change: string): LineResult {
  return { lineNumber, input, status: 'ok', change, error: null }
}

function makeGateway(results: LineResult[]): ChangeGateway {
  return { submitLines: vi.fn().mockResolvedValue(results) }
}

function setOwed(value: string) {
  fireEvent.change(screen.getByLabelText(/amount owed/i), { target: { value } })
}

test('renders tabs, cashier panel by default, and the empty output state', () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  expect(screen.getByRole('tab', { name: /cashier/i })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: /flat file/i })).toHaveAttribute(
    'aria-selected',
    'false',
  )
  expect(screen.getByLabelText(/amount owed/i)).toBeInTheDocument()
  expect(screen.getByText('No output yet')).toBeInTheDocument()
})

test('tapping payment denominations accumulates the paid total and notifies', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  await userEvent.click(screen.getByRole('button', { name: 'Add $5' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add $5' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add 25¢' }))

  expect(screen.getByLabelText(/amount paid/i)).toHaveTextContent('$10.25')
  expect(screen.getByRole('status')).toHaveTextContent('Added 25¢')
})

test('the payment notice flags overpayment when a tap jumps past owed', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  setOwed('5.00')
  await userEvent.click(screen.getByRole('button', { name: 'Add $1' }))
  expect(screen.getByRole('status')).toHaveTextContent('Added $1')
  expect(screen.getByRole('status')).not.toHaveTextContent('exceeds')

  await userEvent.click(screen.getByRole('button', { name: 'Add $20' }))
  expect(screen.getByRole('status')).toHaveTextContent('Added $20, paid exceeds owed')
})

test('exact coverage notices plainly and locks without an overpayment flag', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  setOwed('5.00')
  await userEvent.click(screen.getByRole('button', { name: 'Add $5' }))

  expect(screen.getByRole('status')).toHaveTextContent('Added $5')
  expect(screen.getByRole('status')).not.toHaveTextContent('exceeds')
  expect(screen.getByRole('button', { name: 'Add $1' })).toBeDisabled()
})

test('payment notices stay plain while no owed amount is set', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  await userEvent.click(screen.getByRole('button', { name: 'Add $20' }))
  expect(screen.getByRole('status')).toHaveTextContent('Added $20')
  expect(screen.getByRole('status')).not.toHaveTextContent('exceeds')
})

test('payment buttons lock once paid covers owed: 4x $100 on 300.10, 5th click dead', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  setOwed('300.10')
  const hundred = screen.getByRole('button', { name: 'Add $100' })

  await userEvent.click(hundred)
  await userEvent.click(hundred)
  await userEvent.click(hundred)
  expect(screen.getByLabelText(/amount paid/i)).toHaveTextContent('$300.00')
  expect(hundred).toBeEnabled()

  await userEvent.click(hundred)
  expect(screen.getByLabelText(/amount paid/i)).toHaveTextContent('$400.00')
  expect(hundred).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Add 1¢' })).toBeDisabled()

  await userEvent.click(hundred)
  expect(screen.getByLabelText(/amount paid/i)).toHaveTextContent('$400.00')

  await userEvent.click(screen.getByRole('button', { name: /clear paid/i }))
  expect(hundred).toBeEnabled()
})

test('calculate change submits owed,paid and renders output with tokens', async () => {
  const gateway = makeGateway([ok(1, '2.12,3.00', '3 quarters,1 dime,3 pennies')])
  render(<CashRegisterScreen gateway={gateway} />)

  setOwed('2.12')
  await userEvent.click(screen.getByRole('button', { name: 'Add $1' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add $1' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add $1' }))
  await userEvent.click(screen.getByRole('button', { name: /calculate change/i }))

  expect(gateway.submitLines).toHaveBeenCalledWith(['2.12,3.00'])
  expect(await screen.findByText('3 quarters,1 dime,3 pennies')).toBeInTheDocument()
  expect(screen.getByLabelText('3 × 25¢')).toBeInTheDocument()
})

test('invalid owed disables calculate and shows a validation message', () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  setOwed('abc')
  expect(screen.getByRole('button', { name: /calculate change/i })).toBeDisabled()
  expect(screen.getByText('Invalid owed amount')).toBeInTheDocument()
})

test('underpayment disables calculate and explains why', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  setOwed('5.00')
  await userEvent.click(screen.getByRole('button', { name: 'Add $1' }))

  expect(screen.getByRole('button', { name: /calculate change/i })).toBeDisabled()
  expect(screen.getByText('Paid total is less than owed')).toBeInTheDocument()
})

test('empty owed disables calculate without a validation message', () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  expect(screen.getByRole('button', { name: /calculate change/i })).toBeDisabled()
  expect(screen.queryByText('Invalid owed amount')).not.toBeInTheDocument()
  expect(screen.queryByText('Paid total is less than owed')).not.toBeInTheDocument()
})

test('clear paid resets the total', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  await userEvent.click(screen.getByRole('button', { name: 'Add $20' }))
  await userEvent.click(screen.getByRole('button', { name: /clear paid/i }))

  expect(screen.getByLabelText(/amount paid/i)).toHaveTextContent('$0.00')
})

test('generate owed fills the owed input', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} generateOwed={() => '7.77'} />)

  await userEvent.click(screen.getByRole('button', { name: /generate owed/i }))

  expect(screen.getByLabelText(/amount owed/i)).toHaveValue('7.77')
})

test('flat file tab is preloaded with the sample and submits its lines', async () => {
  const gateway = makeGateway([
    ok(1, '2.12,3.00', '3 quarters,1 dime,3 pennies'),
    ok(2, '1.97,2.00', '3 pennies'),
    ok(3, '3.33,5.00', '1 dollar,1 quarter,6 nickels,12 pennies'),
  ])
  render(<CashRegisterScreen gateway={gateway} />)

  await userEvent.click(screen.getByRole('tab', { name: /flat file/i }))
  expect(screen.getByLabelText(/flat file lines/i)).toHaveValue(SAMPLE_INPUT)

  await userEvent.click(screen.getByRole('button', { name: /calculate change/i }))

  expect(gateway.submitLines).toHaveBeenCalledWith(['2.12,3.00', '1.97,2.00', '3.33,5.00'])
  expect(await screen.findByText('3 pennies')).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})

test('load sample restores the sample after editing', async () => {
  render(<CashRegisterScreen gateway={makeGateway([])} />)

  await userEvent.click(screen.getByRole('tab', { name: /flat file/i }))
  fireEvent.change(screen.getByLabelText(/flat file lines/i), { target: { value: '' } })
  expect(screen.getByRole('button', { name: /calculate change/i })).toBeDisabled()

  await userEvent.click(screen.getByRole('button', { name: /load sample/i }))
  expect(screen.getByLabelText(/flat file lines/i)).toHaveValue(SAMPLE_INPUT)
})

test('per-line errors appear as Line N: message in the output', async () => {
  const gateway = makeGateway([
    ok(1, '1.97,2.00', '3 pennies'),
    {
      lineNumber: 2,
      input: 'bogus,x',
      status: 'error',
      change: null,
      error: "invalid amount: 'bogus'",
    },
  ])
  render(<CashRegisterScreen gateway={gateway} />)

  await userEvent.click(screen.getByRole('tab', { name: /flat file/i }))
  fireEvent.change(screen.getByLabelText(/flat file lines/i), {
    target: { value: '1.97,2.00\nbogus,x' },
  })
  await userEvent.click(screen.getByRole('button', { name: /calculate change/i }))

  expect(await screen.findByText("Line 2: invalid amount: 'bogus'")).toBeInTheDocument()
})

test('gateway failure shows an alert inside the output panel', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi.fn().mockRejectedValue(new Error('boom')),
  }
  render(<CashRegisterScreen gateway={gateway} />)

  setOwed('1.00')
  await userEvent.click(screen.getByRole('button', { name: 'Add $1' }))
  await userEvent.click(screen.getByRole('button', { name: /calculate change/i }))

  const output = screen.getByRole('region', { name: /output/i })
  expect(await within(output).findByRole('alert')).toHaveTextContent('unexpected failure')
})
