// Domain types mirroring the backend API contract, in frontend naming.
// Screens and hooks depend on these and on ChangeGateway only; concrete
// network access lives in adapters/.

export type CurrencyCode = 'USD' | 'EUR'

export interface ChangeConfig {
  currency?: CurrencyCode
  divisor?: number
  seed?: number | null
}

export type LineStatus = 'ok' | 'error'

export interface LineResult {
  lineNumber: number
  input: string
  status: LineStatus
  change: string | null
  error: string | null
}

export interface ChangeGateway {
  submitLines(lines: string[], config?: ChangeConfig): Promise<LineResult[]>
}

export class GatewayError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GatewayError'
  }
}
