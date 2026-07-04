// Shared submit workflow: in-flight guard, results, failure translation.
// Both tabs feed lines into the same submission state.

import { useState } from 'react'
import { GatewayError } from '@/domain/change'
import type { ChangeGateway, LineResult } from '@/domain/change'

export function useSubmitChange(gateway: ChangeGateway) {
  const [results, setResults] = useState<LineResult[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  async function submit(lines: string[]): Promise<void> {
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

  return { results, submitting, failure, submit }
}
