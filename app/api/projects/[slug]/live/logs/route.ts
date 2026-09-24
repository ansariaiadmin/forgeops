import { createSseStream } from '@/lib/sse'
import { generateLiveLog } from '@/lib/api/health'

/**
 * GET /api/projects/[slug]/live/logs — SSE stream of live log lines
 * (one line every 1.5s). Client filters by level/service.
 */
export async function GET(request: Request) {
  return createSseStream(request, {
    intervalMs: 1500,
    produce: () => generateLiveLog(),
  })
}
