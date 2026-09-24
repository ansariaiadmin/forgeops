/** Simple in-memory sliding-window rate limiter (per-process). */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Returns true when the request is allowed, false when rate-limited. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count += 1
  return bucket.count <= limit
}

/** Best-effort client IP from proxy headers. */
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

// Keep the map from growing unboundedly.
setInterval(
  () => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key)
    }
  },
  10 * 60 * 1000,
).unref()
