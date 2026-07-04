import { act, renderHook, waitFor } from '@testing-library/react'
import { useSubmitChange } from '@/hooks/useSubmitChange'
import { GatewayError } from '@/domain/change'
import type { ChangeGateway, LineResult } from '@/domain/change'

const RESULT: LineResult = {
  lineNumber: 1,
  input: '1.97,2.00',
  status: 'ok',
  change: '3 pennies',
  error: null,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

test('initial state is idle and empty', () => {
  const gateway: ChangeGateway = { submitLines: vi.fn() }
  const { result } = renderHook(() => useSubmitChange(gateway))

  expect(result.current.results).toBeNull()
  expect(result.current.submitting).toBe(false)
  expect(result.current.failure).toBeNull()
})

test('successful submit stores results', async () => {
  const gateway: ChangeGateway = { submitLines: vi.fn().mockResolvedValue([RESULT]) }
  const { result } = renderHook(() => useSubmitChange(gateway))

  await act(() => result.current.submit(['1.97,2.00']))

  expect(gateway.submitLines).toHaveBeenCalledWith(['1.97,2.00'])
  expect(result.current.results).toEqual([RESULT])
  expect(result.current.submitting).toBe(false)
})

test('submitting no lines never calls the gateway', async () => {
  const gateway: ChangeGateway = { submitLines: vi.fn() }
  const { result } = renderHook(() => useSubmitChange(gateway))

  await act(() => result.current.submit([]))

  expect(gateway.submitLines).not.toHaveBeenCalled()
})

test('submitting is true while in flight and a second submit is ignored', async () => {
  const { promise, resolve } = deferred<LineResult[]>()
  const gateway: ChangeGateway = { submitLines: vi.fn().mockReturnValue(promise) }
  const { result } = renderHook(() => useSubmitChange(gateway))

  act(() => {
    void result.current.submit(['1.97,2.00'])
  })
  await waitFor(() => expect(result.current.submitting).toBe(true))

  await act(() => result.current.submit(['1.97,2.00']))
  expect(gateway.submitLines).toHaveBeenCalledTimes(1)

  act(() => resolve([RESULT]))
  await waitFor(() => expect(result.current.submitting).toBe(false))
  expect(result.current.results).toEqual([RESULT])
})

test('gateway rejection surfaces the failure and clears results', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi
      .fn()
      .mockResolvedValueOnce([RESULT])
      .mockRejectedValueOnce(new GatewayError('backend unreachable')),
  }
  const { result } = renderHook(() => useSubmitChange(gateway))

  await act(() => result.current.submit(['1.97,2.00']))
  await act(() => result.current.submit(['1.97,2.00']))

  expect(result.current.failure).toBe('backend unreachable')
  expect(result.current.results).toBeNull()
})

test('a successful submit clears a previous failure', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi
      .fn()
      .mockRejectedValueOnce(new GatewayError('backend unreachable'))
      .mockResolvedValueOnce([RESULT]),
  }
  const { result } = renderHook(() => useSubmitChange(gateway))

  await act(() => result.current.submit(['1.97,2.00']))
  expect(result.current.failure).toBe('backend unreachable')

  await act(() => result.current.submit(['1.97,2.00']))
  expect(result.current.failure).toBeNull()
  expect(result.current.results).toEqual([RESULT])
})

test('non-gateway errors surface a generic failure', async () => {
  const gateway: ChangeGateway = { submitLines: vi.fn().mockRejectedValue(new TypeError('boom')) }
  const { result } = renderHook(() => useSubmitChange(gateway))

  await act(() => result.current.submit(['1.97,2.00']))

  expect(result.current.failure).toBe('unexpected failure')
})
