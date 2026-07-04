// The one shared visual for bills and coins: a tappable payment button
// when given onPress, a static output token (optionally counted) otherwise.

import type { UiDenomination } from '@/domain/denominations'
import './DenominationToken.css'

interface DenominationTokenProps {
  denomination: UiDenomination
  count?: number
  onPress?: () => void
  disabled?: boolean
}

export function DenominationToken({
  denomination,
  count,
  onPress,
  disabled,
}: DenominationTokenProps) {
  const className = `denomination-token denomination-token--${denomination.kind}`
  const body = (
    <>
      <span className="denomination-token__label">{denomination.label}</span>
      {count !== undefined && <span className="denomination-token__count">×{count}</span>}
    </>
  )
  if (onPress) {
    return (
      <button
        type="button"
        className={className}
        onClick={onPress}
        disabled={disabled}
        aria-label={`Add ${denomination.label}`}
      >
        {body}
      </button>
    )
  }
  return (
    <span className={className} role="img" aria-label={`${count ?? 1} × ${denomination.label}`}>
      {body}
    </span>
  )
}
