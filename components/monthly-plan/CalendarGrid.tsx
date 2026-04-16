'use client'

import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns'
import type { PlanEntry } from '@/lib/monthly-plan-types'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarGrid({
  month,
  entries,
  onDayClick,
}: {
  month: Date
  entries: PlanEntry[]
  onDayClick: (date: Date) => void
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const entryMap = useMemo(() => {
    const map: Record<string, PlanEntry> = {}
    for (const e of entries) map[e.date] = e
    return map
  }, [entries])

  return (
    <div
      className="bg-[oklch(0.995_0.004_65)]"
      style={{ borderRadius: '1px', boxShadow: '4px 4px 0px oklch(0.65 0.13 48)' }}
    >
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-[oklch(0.87_0.018_58)]">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] uppercase tracking-widest text-[oklch(0.6_0.025_55)] py-3"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[oklch(0.87_0.018_58)]">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const entry = entryMap[key]
          const inMonth = isSameMonth(day, month)
          const today = isToday(day)

          return (
            <button
              key={key}
              onClick={() => inMonth && onDayClick(day)}
              disabled={!inMonth}
              className={[
                'relative flex flex-col gap-1.5 p-2.5 min-h-[80px] text-left transition-colors',
                inMonth && !today ? 'bg-[oklch(0.995_0.004_65)] hover:bg-[oklch(0.97_0.01_60)]' : '',
                today ? 'bg-[oklch(0.96_0.018_60)]' : '',
                !inMonth ? 'bg-[oklch(0.98_0.005_60)] opacity-40 cursor-default' : 'cursor-pointer',
              ].filter(Boolean).join(' ')}
            >
              {/* Day number */}
              <span
                className={[
                  'text-xs leading-none',
                  today
                    ? 'font-bold text-[oklch(0.55_0.13_48)]'
                    : 'text-[oklch(0.45_0.025_55)]',
                ].join(' ')}
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {format(day, 'd')}
              </span>

              {/* Event dot + title */}
              {entry && (
                <div className="flex items-start gap-1.5 w-full">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 mt-px"
                    style={{ backgroundColor: entry.colorTag }}
                  />
                  <span className="text-[10px] leading-tight text-[oklch(0.35_0.025_55)] line-clamp-2 break-words">
                    {entry.title}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
