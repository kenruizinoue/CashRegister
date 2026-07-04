import { act, renderHook, waitFor } from '@testing-library/react'
import { useChangeWorkflow } from '@/hooks/useChangeWorkflow'
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
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

test('initial state is empty and idle', () => {
  const gateway: ChangeGateway = { submitLines: vi.fn() }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  expect(result.current.text).toBe('')
  expect(result.current.lines).toEqual([])
  expect(result.current.results).toBeNull()
  expect(result.current.submitting).toBe(false)
  expect(result.current.failure).toBeNull()
})

test('successful submit stores results and returns to idle', async () => {
  const gateway: ChangeGateway = { submitLines: vi.fn().mockResolvedValue([RESULT]) }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText(' 1.97,2.00 \n\n'))
  expect(result.current.lines).toEqual(['1.97,2.00'])

  await act(() => result.current.submit())

  expect(gateway.submitLines).toHaveBeenCalledWith(['1.97,2.00'])
  expect(result.current.results).toEqual([RESULT])
  expect(result.current.submitting).toBe(false)
  expect(result.current.failure).toBeNull()
})

test('submit with no non-blank lines never calls the gateway', async () => {
  const gateway: ChangeGateway = { submitLines: vi.fn() }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText('   \n \n'))
  await act(() => result.current.submit())

  expect(gateway.submitLines).not.toHaveBeenCalled()
})

test('submitting is true while the request is in flight', async () => {
  const { promise, resolve } = deferred<LineResult[]>()
  const gateway: ChangeGateway = { submitLines: vi.fn().mockReturnValue(promise) }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText('1.97,2.00'))
  act(() => {
    void result.current.submit()
  })

  await waitFor(() => expect(result.current.submitting).toBe(true))
  act(() => resolve([RESULT]))
  await waitFor(() => expect(result.current.submitting).toBe(false))
  expect(result.current.results).toEqual([RESULT])
})

test('a second submit while one is in flight is ignored', async () => {
  const { promise, resolve } = deferred<LineResult[]>()
  const gateway: ChangeGateway = { submitLines: vi.fn().mockReturnValue(promise) }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText('1.97,2.00'))
  act(() => {
    void result.current.submit()
  })
  await waitFor(() => expect(result.current.submitting).toBe(true))
  await act(() => result.current.submit())

  expect(gateway.submitLines).toHaveBeenCalledTimes(1)
  act(() => resolve([RESULT]))
  await waitFor(() => expect(result.current.submitting).toBe(false))
})

test('gateway rejection mid-flight surfaces the failure and clears results', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi
      .fn()
      .mockResolvedValueOnce([RESULT])
      .mockRejectedValueOnce(new GatewayError('backend unreachable')),
  }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText('1.97,2.00'))
  await act(() => result.current.submit())
  expect(result.current.results).toEqual([RESULT])

  await act(() => result.current.submit())
  expect(result.current.failure).toBe('backend unreachable')
  expect(result.current.results).toBeNull()
  expect(result.current.submitting).toBe(false)
})

test('a successful submit clears a previous failure', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi
      .fn()
      .mockRejectedValueOnce(new GatewayError('backend unreachable'))
      .mockResolvedValueOnce([RESULT]),
  }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText('1.97,2.00'))
  await act(() => result.current.submit())
  expect(result.current.failure).toBe('backend unreachable')

  await act(() => result.current.submit())
  expect(result.current.failure).toBeNull()
  expect(result.current.results).toEqual([RESULT])
})

test('non-gateway errors surface a generic failure', async () => {
  const gateway: ChangeGateway = {
    submitLines: vi.fn().mockRejectedValue(new TypeError('boom')),
  }
  const { result } = renderHook(() => useChangeWorkflow(gateway))

  act(() => result.current.setText('1.97,2.00'))
  await act(() => result.current.submit())

  expect(result.current.failure).toBe('unexpected failure')
})
