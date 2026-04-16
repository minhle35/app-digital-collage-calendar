import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, createGlobalCap, getIp } from '@/lib/rate-limit'

// 1 event per IP per 2 hours
const perIpLimiter = createRateLimit({ limit: 1, windowMs: 2 * 60 * 60 * 1000 })

// Hard cap: max 100 events total across all users for the lifetime of this instance.
// Keeps Railway compute and Liveblocks usage predictable for a demo deployment.
const globalCap = createGlobalCap(100)

export async function POST(request: NextRequest) {
  // Global cap check first — cheapest gate
  if (!globalCap.check()) {
    return NextResponse.json(
      { error: 'global_cap', message: 'This demo has reached its event limit. Please check back later.' },
      { status: 503 }
    )
  }

  // Per-IP check
  const ip = getIp(request)
  const rl = perIpLimiter(ip)

  if (!rl.success) {
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000)
    const retryAfterMin = Math.ceil(retryAfterSec / 60)
    return NextResponse.json(
      {
        error: 'per_ip_limit',
        message: `You can create one event every 2 hours. Try again in ${retryAfterMin} minute${retryAfterMin !== 1 ? 's' : ''}.`,
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
        },
      }
    )
  }

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return NextResponse.json({ id })
}
