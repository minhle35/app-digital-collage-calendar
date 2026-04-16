/**
 * In-memory sliding-window rate limiter.
 * Works on a single Railway instance (no Redis needed).
 * Each limiter instance has its own store — create one per endpoint.
 */

interface Entry {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function createRateLimit(options: {
  /** Max requests allowed per window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}) {
  const store = new Map<string, Entry>()

  // Periodically evict expired entries to prevent memory growth
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, options.windowMs)

  // Don't block Node.js exit
  if (cleanup.unref) cleanup.unref()

  return function check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs })
      return { success: true, limit: options.limit, remaining: options.limit - 1, resetAt: now + options.windowMs }
    }

    if (entry.count >= options.limit) {
      return { success: false, limit: options.limit, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { success: true, limit: options.limit, remaining: options.limit - entry.count, resetAt: entry.resetAt }
  }
}

/**
 * Extract client IP from a Next.js request.
 * On Railway, x-real-ip is set by the proxy and cannot be spoofed by clients.
 * x-forwarded-for is a fallback (first entry = original client).
 */
export function getIp(request: Request): string {
  const headers = request.headers as Headers
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

/**
 * Global hard cap — counts total actions across all IPs for the lifetime
 * of the server process (resets on redeploy).
 * Use for app-wide limits like "max N events ever created on this instance".
 */
export function createGlobalCap(max: number) {
  let count = 0
  return {
    /** Allows the action and increments if under cap. Returns false when cap is hit. */
    check(): boolean {
      if (count >= max) return false
      count++
      return true
    },
    remaining(): number {
      return Math.max(0, max - count)
    },
    total(): number {
      return count
    },
  }
}
