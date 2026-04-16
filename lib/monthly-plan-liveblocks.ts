import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { LiveList } from '@liveblocks/client'

// Separate client so storage types don't conflict with the event canvas client
const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
})

type MonthlyPlanStorage = {
  // JSON.stringify(PlanEntry)[] — keeps Liveblocks schema flat
  entries: LiveList<string>
}

type MonthlyPlanPresence = Record<string, never>

export const {
  RoomProvider: MonthlyPlanRoomProvider,
  useStorage: useMonthlyPlanStorage,
  useMutation: useMonthlyPlanMutation,
  useStatus: useMonthlyPlanStatus,
} = createRoomContext<MonthlyPlanPresence, MonthlyPlanStorage>(client)
