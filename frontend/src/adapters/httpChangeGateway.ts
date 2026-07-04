// HTTP implementation of ChangeGateway against the FastAPI backend.
// Owns the wire format (snake_case) and translates transport failures
// into GatewayError; no change math happens here.

import { GatewayError } from '@/domain/change'
import type { ChangeConfig, ChangeGateway, LineResult, LineStatus } from '@/domain/change'

interface ApiLineResult {
  line_number: number
  input: string
  status: LineStatus
  change: string | null
  error: string | null
}

function buildBody(lines: string[], config?: ChangeConfig) {
  return {
    lines,
    ...(config?.currency !== undefined && { currency: config.currency }),
    ...(config?.divisor !== undefined && { divisor: config.divisor }),
    ...(config?.seed !== undefined && config.seed !== null && { seed: config.seed }),
  }
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isApiLineResult(entry: unknown): entry is ApiLineResult {
  if (typeof entry !== 'object' || entry === null) {
    return false
  }
  const candidate = entry as Record<string, unknown>
  return (
    typeof candidate.line_number === 'number' &&
    typeof candidate.input === 'string' &&
    (candidate.status === 'ok' || candidate.status === 'error') &&
    isStringOrNull(candidate.change) &&
    isStringOrNull(candidate.error)
  )
}

function toDomain(entry: ApiLineResult): LineResult {
  return {
    lineNumber: entry.line_number,
    input: entry.input,
    status: entry.status,
    change: entry.change,
    error: entry.error,
  }
}

export function createHttpChangeGateway(
  baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? '',
): ChangeGateway {
  return {
    async submitLines(lines, config) {
      let response: Response
      try {
        response = await fetch(`${baseUrl}/change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(lines, config)),
        })
      } catch {
        throw new GatewayError('backend unreachable')
      }
      if (!response.ok) {
        throw new GatewayError(`backend rejected the request (HTTP ${response.status})`)
      }
      let payload: { results?: unknown[] }
      try {
        payload = await response.json()
      } catch {
        throw new GatewayError('malformed response from backend')
      }
      if (!payload || !Array.isArray(payload.results) || !payload.results.every(isApiLineResult)) {
        throw new GatewayError('malformed response from backend')
      }
      return payload.results.map(toDomain)
    },
  }
}
