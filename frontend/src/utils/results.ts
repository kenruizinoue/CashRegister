// Pure display helpers for line results.

import type { LineResult } from '@/domain/change'

export function resultText(result: LineResult): string {
  if (result.status === 'ok') {
    return result.change ?? ''
  }
  return result.error ?? ''
}
