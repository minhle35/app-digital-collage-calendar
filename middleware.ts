import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, getIp } from '@/lib/rate-limit'

// Broad scraper/bot defense 
// heavily across tabs while staying well clear of normal navigation patterns.
// Precise per-endpoint business rules (e.g. 1 event per 2h) live in each
// route handler and must not be crowded out by this limit.
const globalLimiter = createRateLimit({ limit: 60, windowMs: 60_000 })

export function middleware(request: NextRequest) {
  const ip = getIp(request)
  const rl = globalLimiter(ip)

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
}
