import { createSseStream } from '@/lib/sse'
import { generateMetricPoint } from '@/lib/api/health'

/**
 * GET /api/projects/[slug]/live/metrics — SSE stream of metric points
 * (CPU, RAM, network, request rate every 3s).
 */
export async function GET(request: Request) {
  return createSseStream(request, {
    intervalMs: 3000,
    produce: () => generateMetricPoint(),
  })
}
