'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  addMonths,
  subMonths,
  format,
  parseISO,
  isSameMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Copy, Check, Share2 } from 'lucide-react'
import { useMonthlyPlanStorage, useMonthlyPlanMutation } from '@/lib/monthly-plan-liveblocks'
import { CalendarGrid } from './CalendarGrid'
import { DayEventDialog } from './DayEventDialog'
import type { PlanEntry } from '@/lib/monthly-plan-types'

export function MonthlyPlanPage({
  planId,
  startMonth,
  endMonth,
}: {
  planId: string
  startMonth: string
  endMonth: string
}) {
  const startDate = useMemo(
    () => (startMonth ? parseISO(`${startMonth}-01`) : new Date()),
    [startMonth]
  )
  const endDate = useMemo(
    () => (endMonth ? parseISO(`${endMonth}-01`) : addMonths(new Date(), 5)),
    [endMonth]
  )

  const [currentMonth, setCurrentMonth] = useState(startDate)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Liveblocks
  const rawEntries = useMonthlyPlanStorage((root) => root.entries)
  const entries: PlanEntry[] = useMemo(
    () => (rawEntries ? rawEntries.map((s) => JSON.parse(s) as PlanEntry) : []),
    [rawEntries]
  )

  const addEntry = useMonthlyPlanMutation(({ storage }, entry: PlanEntry) => {
    storage.get('entries').push(JSON.stringify(entry))
  }, [])

  const canGoPrev = !isSameMonth(currentMonth, startDate)
  const canGoNext = !isSameMonth(currentMonth, endDate)

  const plannerUrl = typeof window !== 'undefined' ? window.location.href : ''

  function handleCopy() {
    navigator.clipboard.writeText(plannerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const existingEntry =
    selectedDate
      ? entries.find((e) => e.date === format(selectedDate, 'yyyy-MM-dd')) ?? null
      : null

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'oklch(0.975 0.008 60)',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 31px, oklch(0.87 0.018 58 / 0.35) 31px, oklch(0.87 0.018 58 / 0.35) 32px)',
      }}
    >
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[oklch(0.87_0.018_58)]">
        <Link
          href="/"
          className="text-2xl tracking-tight text-[oklch(0.18_0.02_50)] hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          DayMark
        </Link>

        <div className="flex items-center gap-3">
          {/* Range stamp */}
          <span
            className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] border border-[oklch(0.87_0.018_58)] text-[oklch(0.55_0.025_55)] px-3 py-1.5"
            style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '1px' }}
          >
            {format(startDate, 'MMM yyyy')} – {format(endDate, 'MMM yyyy')}
          </span>

          {/* Share button */}
          <div className="relative">
            <button
              onClick={() => setShareOpen((o) => !o)}
              className="flex items-center gap-1.5 border border-[oklch(0.87_0.018_58)] text-[oklch(0.55_0.025_55)] hover:text-[oklch(0.18_0.02_50)] hover:border-[oklch(0.65_0.025_55)] px-3 py-1.5 transition-colors"
              style={{ borderRadius: '1px' }}
            >
              <Share2 size={13} />
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                Share
              </span>
            </button>

            {shareOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShareOpen(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 z-30 bg-[oklch(0.995_0.004_65)] border border-[oklch(0.87_0.018_58)] p-4 flex flex-col gap-3 w-72"
                  style={{ borderRadius: '1px', boxShadow: '3px 3px 0px oklch(0.65 0.13 48)' }}
                >
                  <p
                    className="text-[10px] uppercase tracking-widest text-[oklch(0.6_0.025_55)]"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    Your planner link
                  </p>
                  <code
                    className="text-[11px] text-[oklch(0.35_0.025_55)] bg-[oklch(0.93_0.02_65)] px-2.5 py-2 break-all leading-relaxed"
                    style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '1px' }}
                  >
                    {plannerUrl}
                  </code>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 text-xs text-[oklch(0.28_0.04_45)] border border-[oklch(0.28_0.04_45)] px-3 py-2 hover:bg-[oklch(0.28_0.04_45)] hover:text-[oklch(0.97_0.008_60)] transition-colors"
                      style={{ borderRadius: '1px', fontFamily: 'var(--font-space-mono)' }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&su=My+DayMark+Planner&body=${encodeURIComponent(plannerUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[oklch(0.55_0.025_55)] border border-[oklch(0.87_0.018_58)] px-3 py-2 hover:border-[oklch(0.65_0.025_55)] transition-colors"
                      style={{ borderRadius: '1px', fontFamily: 'var(--font-space-mono)' }}
                    >
                      Send via Gmail
                    </a>
                    <a
                      href={`mailto:?subject=My+DayMark+Planner&body=${encodeURIComponent(plannerUrl)}`}
                      className="flex items-center gap-2 text-xs text-[oklch(0.55_0.025_55)] border border-[oklch(0.87_0.018_58)] px-3 py-2 hover:border-[oklch(0.65_0.025_55)] transition-colors"
                      style={{ borderRadius: '1px', fontFamily: 'var(--font-space-mono)' }}
                    >
                      Send via email app
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Calendar ────────────────────────────────── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            disabled={!canGoPrev}
            className="p-2 text-[oklch(0.55_0.025_55)] hover:text-[oklch(0.18_0.02_50)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <h1
              className="text-3xl sm:text-4xl text-[oklch(0.18_0.02_50)]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <span
              className="text-[10px] uppercase tracking-widest text-[oklch(0.65_0.025_55)]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {entries.filter((e) =>
                e.date.startsWith(format(currentMonth, 'yyyy-MM'))
              ).length} event{entries.filter((e) =>
                e.date.startsWith(format(currentMonth, 'yyyy-MM'))
              ).length !== 1 ? 's' : ''} this month
            </span>
          </div>

          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            disabled={!canGoNext}
            className="p-2 text-[oklch(0.55_0.025_55)] hover:text-[oklch(0.18_0.02_50)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <CalendarGrid
          month={currentMonth}
          entries={entries}
          onDayClick={setSelectedDate}
        />

        <p
          className="text-center text-[10px] uppercase tracking-widest text-[oklch(0.7_0.02_55)]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          Click any date to create an event canvas
        </p>
      </div>

      {/* ── Day event dialog ─────────────────────────── */}
      {selectedDate && (
        <DayEventDialog
          date={selectedDate}
          existingEntry={existingEntry}
          onClose={() => setSelectedDate(null)}
          onAddEntry={addEntry}
        />
      )}
    </main>
  )
}
