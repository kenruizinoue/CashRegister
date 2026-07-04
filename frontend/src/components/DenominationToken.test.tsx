import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DenominationToken } from '@/components/DenominationToken'
import type { UiDenomination } from '@/domain/denominations'

const FIVE: UiDenomination = { id: 'five', label: '$5', valueCents: 500, kind: 'bill' }
const QUARTER: UiDenomination = { id: 'quarter', label: '25¢', valueCents: 25, kind: 'coin' }

test('renders as a tappable button when given onPress', async () => {
  const onPress = vi.fn()
  render(<DenominationToken denomination={FIVE} onPress={onPress} />)

  const button = screen.getByRole('button', { name: 'Add $5' })
  await userEvent.click(button)

  expect(onPress).toHaveBeenCalledTimes(1)
  expect(button).toHaveClass('denomination-token--bill')
})

test('renders as a static token with a count when not pressable', () => {
  render(<DenominationToken denomination={QUARTER} count={3} />)

  const token = screen.getByLabelText('3 × 25¢')
  expect(token.tagName).not.toBe('BUTTON')
  expect(token).toHaveClass('denomination-token--coin')
  expect(token).toHaveTextContent('×3')
})

test('static token without a count reads as a single unit', () => {
  render(<DenominationToken denomination={QUARTER} />)
  expect(screen.getByLabelText('1 × 25¢')).toBeInTheDocument()
})

test('pressable token can be disabled', () => {
  render(<DenominationToken denomination={FIVE} onPress={() => {}} disabled />)
  expect(screen.getByRole('button', { name: 'Add $5' })).toBeDisabled()
})
