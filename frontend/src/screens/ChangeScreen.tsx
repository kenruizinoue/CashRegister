import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { GatewayError } from '@/domain/change'
import type { ChangeGateway, LineResult } from '@/domain/change'
import './ChangeScreen.css'

interface ChangeScreenProps {
  gateway: ChangeGateway
}

function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function ChangeScreen({ gateway }: ChangeScreenProps) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<LineResult[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const lines = toLines(text)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFailure(null)
    try {
      setResults(await gateway.submitLines(lines))
    } catch (error) {
      setResults(null)
      setFailure(error instanceof GatewayError ? error.message : 'unexpected failure')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      setText(await file.text())
    }
  }

  return (
    <main className="change-screen">
      <h1 className="change-screen__title">Cash Register</h1>
      <form className="change-screen__form" onSubmit={handleSubmit}>
        <label className="change-screen__label" htmlFor="transactions">
          Transactions (owed,paid per line)
        </label>
        <textarea
          id="transactions"
          className="change-screen__input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          spellCheck={false}
        />
        <div className="change-screen__actions">
          <label className="change-screen__file">
            Load file
            <input type="file" accept=".txt,text/plain" onChange={handleFile} />
          </label>
          <button type="submit" disabled={submitting || lines.length === 0}>
            Make change
          </button>
        </div>
      </form>
      {failure && (
        <p role="alert" className="change-screen__failure">
          {failure}
        </p>
      )}
      {results && results.length > 0 && (
        <table className="change-screen__results">
          <thead>
            <tr>
              <th>#</th>
              <th>Input</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr
                key={result.lineNumber}
                className={
                  result.status === 'error'
                    ? 'change-screen__row--error'
                    : 'change-screen__row--ok'
                }
              >
                <td>{result.lineNumber}</td>
                <td>{result.input}</td>
                <td>{result.status === 'ok' ? result.change : result.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
