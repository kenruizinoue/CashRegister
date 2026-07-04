import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChangeGateway } from '@/domain/change'
import { USD_PAYMENT_DENOMINATIONS } from '@/domain/denominations'
import type { UiDenomination } from '@/domain/denominations'
import { useSubmitChange } from '@/hooks/useSubmitChange'
import { centsToAmount, parseAmountToCents, randomOwedAmount } from '@/utils/money'
import { toLines } from '@/utils/lines'
import { DenominationToken } from '@/components/DenominationToken'
import { OutputPanel } from '@/components/OutputPanel'
import { Snackbar } from '@/components/Snackbar'
import './CashRegisterScreen.css'

export const SAMPLE_INPUT = '2.12,3.00\n1.97,2.00\n3.33,5.00'

type Tab = 'cashier' | 'flatfile'

interface CashRegisterScreenProps {
  gateway: ChangeGateway
  generateOwed?: () => string
}

export function CashRegisterScreen({
  gateway,
  generateOwed = randomOwedAmount,
}: CashRegisterScreenProps) {
  const [tab, setTab] = useState<Tab>('cashier')
  const [owedText, setOwedText] = useState('')
  const [paidCents, setPaidCents] = useState(0)
  const [fileText, setFileText] = useState(SAMPLE_INPUT)
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null)
  const noticeId = useRef(0)
  const { results, submitting, failure, submit } = useSubmitChange(gateway)

  const owedCents = parseAmountToCents(owedText)
  const owedEntered = owedText.trim().length > 0
  const owedInvalid = owedEntered && owedCents === null
  const underpaid = owedCents !== null && paidCents < owedCents
  const paidCoversOwed = owedCents !== null && paidCents >= owedCents
  const cashierValid = owedCents !== null && !underpaid
  const validationMessage = owedInvalid
    ? 'Invalid owed amount'
    : underpaid
      ? 'Paid total is less than owed'
      : null

  const fileLines = toLines(fileText)

  const dismissNotice = useCallback(() => setNotice(null), [])

  function notify(text: string) {
    noticeId.current += 1
    setNotice({ id: noticeId.current, text })
  }

  function addPayment(denomination: UiDenomination) {
    const newPaid = paidCents + denomination.valueCents
    setPaidCents(newPaid)
    const overpaid = owedCents !== null && newPaid > owedCents
    notify(`Added ${denomination.label}${overpaid ? ', paid exceeds owed' : ''}`)
  }

  function clearPaid() {
    setPaidCents(0)
    notify('Payment cleared')
  }

  function submitCashier(event: FormEvent) {
    event.preventDefault()
    if (!cashierValid) {
      return
    }
    void submit([`${owedText.trim()},${centsToAmount(paidCents)}`])
  }

  function submitFlatFile(event: FormEvent) {
    event.preventDefault()
    void submit(fileLines)
  }

  return (
    <main className="cash-register">
      <header className="cash-register__header">
        <h1 className="cash-register__title">Cash Register</h1>
        <div className="cash-register__tabs" role="tablist" aria-label="Mode">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'cashier'}
            className="cash-register__tab"
            onClick={() => setTab('cashier')}
          >
            Cashier
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'flatfile'}
            className="cash-register__tab"
            onClick={() => setTab('flatfile')}
          >
            Flat File
          </button>
        </div>
      </header>
      <div className="cash-register__panels">
        {tab === 'cashier' ? (
          <form
            className="cash-register__panel cashier-panel"
            role="tabpanel"
            aria-label="Payment"
            onSubmit={submitCashier}
          >
            <div className="cashier-panel__owed">
              <label htmlFor="owed">Amount owed</label>
              <div className="cashier-panel__owed-row">
                <input
                  id="owed"
                  type="text"
                  inputMode="decimal"
                  value={owedText}
                  onChange={(event) => setOwedText(event.target.value)}
                  spellCheck={false}
                />
                <button type="button" onClick={() => setOwedText(generateOwed())}>
                  Generate Owed
                </button>
              </div>
            </div>
            <div className="cashier-panel__paid">
              <span id="paid-label">Amount paid</span>
              <span className="cashier-panel__paid-total" aria-labelledby="paid-label">
                ${centsToAmount(paidCents)}
              </span>
            </div>
            <div className="cashier-panel__grid">
              {USD_PAYMENT_DENOMINATIONS.map((denomination) => (
                <DenominationToken
                  key={denomination.id}
                  denomination={denomination}
                  onPress={() => addPayment(denomination)}
                  disabled={paidCoversOwed}
                />
              ))}
            </div>
            <div className="cashier-panel__actions">
              <button type="submit" disabled={submitting || !cashierValid}>
                Calculate Change
              </button>
              <button type="button" onClick={clearPaid}>
                Clear Paid
              </button>
            </div>
            {validationMessage && (
              <p className="cashier-panel__validation">{validationMessage}</p>
            )}
          </form>
        ) : (
          <form
            className="cash-register__panel flatfile-panel"
            role="tabpanel"
            aria-label="Flat File"
            onSubmit={submitFlatFile}
          >
            <label htmlFor="flatfile">Flat file lines</label>
            <textarea
              id="flatfile"
              className="flatfile-panel__input"
              value={fileText}
              onChange={(event) => setFileText(event.target.value)}
              spellCheck={false}
            />
            <div className="flatfile-panel__actions">
              <button type="submit" disabled={submitting || fileLines.length === 0}>
                Calculate Change
              </button>
              <button type="button" onClick={() => setFileText(SAMPLE_INPUT)}>
                Load Sample
              </button>
            </div>
          </form>
        )}
        <OutputPanel results={results} failure={failure} />
      </div>
      {notice && (
        <Snackbar key={notice.id} message={notice.text} onDone={dismissNotice} />
      )}
    </main>
  )
}
