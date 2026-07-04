// Submit-workflow state for the change screen: input text, in-flight
// guard, results, and gateway failure translation.

import { useState } from 'react'
import { GatewayError } from '@/domain/change'
import type { ChangeGateway, LineResult } from '@/domain/change'
import { toLines } from '@/utils/lines'

export function useChangeWorkflow(gateway: ChangeGateway) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<LineResult[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const lines = toLines(text)

  async function submit(): Promise<void> {
    if (submitting || lines.length === 0) {
      return
    }
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

  return { text, setText, lines, results, submitting, failure, submit }
}
