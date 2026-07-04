// Right-hand output: one row per input line with the count list and
// denomination tokens, per-line errors as "Line N: message".

import type { LineResult } from '@/domain/change'
import { denominationForName } from '@/domain/denominations'
import { parseChangeParts } from '@/utils/changeText'
import { resultText } from '@/utils/results'
import { DenominationToken } from '@/components/DenominationToken'
import './OutputPanel.css'

interface OutputPanelProps {
  results: LineResult[] | null
  failure: string | null
}

function ChangeTokens({ change }: { change: string }) {
  const parts = parseChangeParts(change)
  return (
    <span className="output-panel__tokens">
      {parts.map((part) => {
        const denomination = denominationForName(part.name)
        return denomination ? (
          <DenominationToken key={part.name} denomination={denomination} count={part.count} />
        ) : null
      })}
    </span>
  )
}

export function OutputPanel({ results, failure }: OutputPanelProps) {
  return (
    <section className="output-panel" aria-label="Output">
      <h2 className="output-panel__title">Output</h2>
      {failure ? (
        <p role="alert" className="output-panel__failure">
          {failure}
        </p>
      ) : !results || results.length === 0 ? (
        <p className="output-panel__empty">No output yet</p>
      ) : (
        <ol className="output-panel__rows">
          {results.map((result) => (
            <li
              key={result.lineNumber}
              className={
                result.status === 'error'
                  ? 'output-panel__row output-panel__row--error'
                  : 'output-panel__row'
              }
            >
              {result.status === 'ok' ? (
                <>
                  <span className="output-panel__text">{resultText(result)}</span>
                  <ChangeTokens change={result.change ?? ''} />
                </>
              ) : (
                <span className="output-panel__text">
                  Line {result.lineNumber}: {result.error}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
