// Transient non-blocking notice with an auto-dismiss progress bar.

import { useEffect } from 'react'
import './Snackbar.css'

interface SnackbarProps {
  message: string
  durationMs?: number
  onDone: () => void
}

export function Snackbar({ message, durationMs = 2500, onDone }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, onDone])

  return (
    <div className="snackbar" role="status">
      <span className="snackbar__message">{message}</span>
      <span className="snackbar__progress" />
    </div>
  )
}
