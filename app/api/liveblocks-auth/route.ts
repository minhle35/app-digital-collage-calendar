import { Liveblocks } from '@liveblocks/node'
import { NextRequest, NextResponse } from 'next/server'

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

export async function POST(request: NextRequest) {
  // Anonymous auth — no login required for MVP
  // Later: swap userId/userInfo for real auth session values
  const { room } = await request.json()

  const session = liveblocks.prepareSession(`guest-${crypto.randomUUID()}`, {
    userInfo: {
      name: 'Guest',
    },
  })

  session.allow(room, session.FULL_ACCESS)

  const { status, body } = await session.authorize()
  return new NextResponse(body, { status })
}
