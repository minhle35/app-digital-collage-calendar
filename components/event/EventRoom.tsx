'use client'

import { Suspense, useMemo } from 'react'
import { LiveList, LiveObject } from '@liveblocks/client'
import { RoomProvider } from '@/lib/liveblocks'
import { DEFAULT_METADATA, generateGuestName } from '@/lib/event-types'
import { EventPage } from './EventPage'

interface EventRoomProps {
  eventId: string
}

export function EventRoom({ eventId }: EventRoomProps) {
  const guestName = useMemo(() => generateGuestName(), [])

  return (
    <RoomProvider
      id={`event-${eventId}`}
      initialPresence={{ cursor: null, name: guestName }}
      initialStorage={{
        elements: new LiveList([]),
        metadata: new LiveObject(DEFAULT_METADATA),
      }}
    >
      <Suspense fallback={<EventSkeleton />}>
        <EventPage eventId={eventId} />
      </Suspense>
    </RoomProvider>
  )
}

function EventSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background animate-pulse">
      <div className="h-11 border-b border-border bg-card" />
      <div className="flex-1 flex">
        <div className="w-12 border-r border-border bg-card" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[820px] h-[620px] rounded-lg bg-muted/30" />
        </div>
        <div className="w-[280px] border-l border-border bg-card" />
      </div>
    </div>
  )
}
