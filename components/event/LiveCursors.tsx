'use client'

import { useOthers } from '@/lib/liveblocks'
import { connectionColour } from '@/lib/event-types'

export function LiveCursors() {
  const others = useOthers()

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence.cursor
        if (!cursor) return null
        const colour = connectionColour(other.connectionId)
        const name = other.presence.name

        return (
          <div
            key={other.connectionId}
            className="absolute transition-[left,top] duration-75 ease-linear"
            style={{ left: cursor.x, top: cursor.y }}
          >
            {/* Cursor SVG */}
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
              <path d="M0 0L0 16L4.5 12L7.5 19L9.5 18L6.5 11L12 11L0 0Z" fill={colour} stroke="white" strokeWidth="1" />
            </svg>
            {/* Name label */}
            <div
              className="absolute top-5 left-3 px-1.5 py-0.5 rounded font-mono text-[10px] text-white whitespace-nowrap"
              style={{ backgroundColor: colour }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
