'use client'

import { LiveList } from '@liveblocks/client'
import { MonthlyPlanRoomProvider } from '@/lib/monthly-plan-liveblocks'
import { MonthlyPlanPage } from './MonthlyPlanPage'

export function MonthlyPlanRoom({
  planId,
  startMonth,
  endMonth,
}: {
  planId: string
  startMonth: string
  endMonth: string
}) {
  return (
    <MonthlyPlanRoomProvider
      id={`monthly-plan-${planId}`}
      initialPresence={{}}
      initialStorage={{ entries: new LiveList([]) }}
    >
      <MonthlyPlanPage
        planId={planId}
        startMonth={startMonth}
        endMonth={endMonth}
      />
    </MonthlyPlanRoomProvider>
  )
}
