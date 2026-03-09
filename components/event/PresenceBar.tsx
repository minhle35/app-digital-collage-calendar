'use client'

import { useOthers, useSelf } from '@/lib/liveblocks'
import { connectionColour } from '@/lib/event-types'
import { cn } from '@/lib/utils'

export function PresenceBar() {
  const others = useOthers()
  const self = useSelf()

  const all = [
    ...(self ? [{ id: -1, name: self.presence.name, isSelf: true }] : []),
    ...others.map((o) => ({ id: o.connectionId, name: o.presence.name, isSelf: false })),
  ]

  const visible = all.slice(0, 5)
  const overflow = all.length - 5

  return (
    <div className="flex items-center gap-1">
      {visible.map((user, i) => (
        <div
          key={user.id}
          title={user.isSelf ? `${user.name} (you)` : user.name}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-white border-2 border-background transition-all',
            i > 0 && '-ml-2'
          )}
          style={{ backgroundColor: user.isSelf ? '#c8a876' : connectionColour(user.id) }}
        >
          {user.name[0].toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="-ml-2 w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center font-mono text-[10px] text-muted-foreground">
          +{overflow}
        </div>
      )}
      {others.length > 0 && (
        <span className="ml-1 font-mono text-xs text-muted-foreground">
          {others.length === 1 ? '1 here' : `${others.length} here`}
        </span>
      )}
    </div>
  )
}
