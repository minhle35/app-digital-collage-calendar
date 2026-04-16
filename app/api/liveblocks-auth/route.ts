import { Liveblocks } from '@liveblocks/node'
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, getIp } from '@/lib/rate-limit'

function getLiveblocks() {
  return new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
  })
}

// 10 auth tokens per IP per minute 
// each new tab/refresh costs one token; this blocks bots hammering the endpoint
const limiter = createRateLimit({ limit: 10, windowMs: 60_000 })

export async function POST(request: NextRequest) {
  const ip = getIp(request)
  const rl = limiter(ip)

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // Anonymous auth — no login required for MVP
  // Later: swap userId/userInfo for real auth session values
  const { room } = await request.json()

  const liveblocks = getLiveblocks()
  const session = liveblocks.prepareSession(`guest-${crypto.randomUUID()}`, {
    userInfo: {
      name: 'Guest',
    },
  })

  session.allow(room, session.FULL_ACCESS)

  const { status, body } = await session.authorize()
  return new NextResponse(body, {
    status,
    headers: {
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
    },
  })
}
