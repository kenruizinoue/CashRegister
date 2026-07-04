import { act, render, screen } from '@testing-library/react'
import { Snackbar } from '@/components/Snackbar'

afterEach(() => {
  vi.useRealTimers()
})

test('shows the message as a status with a progress indicator', () => {
  render(<Snackbar message="Added $5" onDone={() => {}} />)

  const status = screen.getByRole('status')
  expect(status).toHaveTextContent('Added $5')
  expect(status.querySelector('.snackbar__progress')).not.toBeNull()
})

test('calls onDone after its duration', () => {
  vi.useFakeTimers()
  const onDone = vi.fn()
  render(<Snackbar message="Added $5" durationMs={1000} onDone={onDone} />)

  act(() => {
    vi.advanceTimersByTime(999)
  })
  expect(onDone).not.toHaveBeenCalled()

  act(() => {
    vi.advanceTimersByTime(1)
  })
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('unmount cancels the timer', () => {
  vi.useFakeTimers()
  const onDone = vi.fn()
  const { unmount } = render(<Snackbar message="Added $5" durationMs={1000} onDone={onDone} />)

  unmount()
  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(onDone).not.toHaveBeenCalled()
})
