import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { Storage, Presence, BroadcastEvent } from './event-types'

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
})

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useStorage,
  useMutation,
  useOthers,
  useOthersMapped,
  useSelf,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = createRoomContext<Presence, Storage, never, BroadcastEvent>(client)
