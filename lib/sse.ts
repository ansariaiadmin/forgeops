import { getSessionUser } from '@/lib/auth'

/** Serialize a single SSE frame. */
export function sseFrame(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export interface SseStreamOptions {
  /** Interval between emissions (ms). */
  intervalMs: number
  /** Emit a payload on each tick. */
  produce: () => unknown
  /** Heartbeat interval (0 = disabled). */
  heartbeatMs?: number
}

/**
 * Build an SSE response: a ReadableStream that emits `produce()` every
 * intervalMs until the client disconnects. Guards with the session.
 */
export async function createSseStream(
  request: Request,
  { intervalMs, produce, heartbeatMs = 15000 }: SseStreamOptions,
): Promise<Response> {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Initial snapshot so the UI renders immediately.
      controller.enqueue(encoder.encode(sseFrame(produce())))

      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(sseFrame(produce())))
        } catch {
          clearInterval(timer)
        }
      }, intervalMs)

      const heartbeat = heartbeatMs
        ? setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': ping\n\n'))
            } catch {
              /* stream closed */
            }
          }, heartbeatMs)
        : null

      request.signal.addEventListener('abort', () => {
        clearInterval(timer)
        if (heartbeat) clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
