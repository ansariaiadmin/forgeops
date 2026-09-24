'use client'

import * as React from 'react'

/**
 * Subscribe to a Server-Sent Events stream with automatic reconnection.
 * `onEvent` receives the parsed `data` payload of each `message` event.
 */
export function useEventStream(
  url: string | null,
  onEvent: (data: string) => void,
  enabled = true,
) {
  const onEventRef = React.useRef(onEvent)
  onEventRef.current = onEvent

  const [connected, setConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!url || !enabled) return
    const streamUrl = url

    let cancelled = false
    let controller: AbortController | null = null
    let retryTimer: number | null = null
    let retries = 0

    async function connect() {
      if (cancelled) return
      controller = new AbortController()
      setError(null)

      try {
        const response = await fetch(streamUrl, {
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: 'text/event-stream' },
        } as RequestInit)
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

        setConnected(true)
        retries = 0

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // SSE frames are separated by blank lines.
          const frames = buffer.split('\n\n')
          buffer = frames.pop() ?? ''
          for (const frame of frames) {
            const dataLine = frame.split('\n').find((line) => line.startsWith('data:'))
            if (dataLine) {
              onEventRef.current(dataLine.slice(5).trim())
            }
          }
        }
      } catch {
        if (cancelled) return
        setConnected(false)
        setError('Live stream disconnected — reconnecting…')
      } finally {
        setConnected(false)
      }

      // Auto-reconnect with capped backoff.
      if (!cancelled) {
        const delay = Math.min(1000 * 2 ** retries, 8000)
        retries += 1
        retryTimer = window.setTimeout(() => {
          void connect()
        }, delay)
      }
    }

    void connect()

    return () => {
      cancelled = true
      controller?.abort()
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [url, enabled])

  return { connected, error }
}
