import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, createGlobalCap, getIp } from '@/lib/rate-limit'

// 3 planner per IP per 2 hours 
const perIpLimiter = createRateLimit({ limit: 3, windowMs: 2 * 60 * 60 * 1000 })

// 50 planners total across all users for this instance
const globalCap = createGlobalCap(50)

export async function POST(request: NextRequest) {
  if (!globalCap.check()) {
    return NextResponse.json(
      { error: 'global_cap', message: 'This demo has reached its planner limit. Please check back later.' },
      { status: 503 }
    )
  }

  const ip = getIp(request)
  const rl = perIpLimiter(ip)

  if (!rl.success) {
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000)
    const retryAfterMin = Math.ceil(retryAfterSec / 60)
    return NextResponse.json(
      {
        error: 'per_ip_limit',
        message: `You can create one planner every 2 hours. Try again in ${retryAfterMin} minute${retryAfterMin !== 1 ? 's' : ''}.`,
        retryAfter: retryAfterSec,
      },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return NextResponse.json({ id })
}
