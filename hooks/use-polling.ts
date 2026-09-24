'use client'

import * as React from 'react'

/**
 * Run `callback` on a fixed interval (e.g. 5s polling for live data).
 * Pass `null` as interval to pause. Cleans up on unmount.
 */
export function usePolling(callback: () => void, intervalMs: number | null) {
  const callbackRef = React.useRef(callback)

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  React.useEffect(() => {
    if (intervalMs === null) return
    const id = window.setInterval(() => callbackRef.current(), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
}
