'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { PLAN_COLORS, type PlanEntry } from '@/lib/monthly-plan-types'

export function DayEventDialog({
  date,
  existingEntry,
  onClose,
  onAddEntry,
}: {
  date: Date
  existingEntry: PlanEntry | null
  onClose: () => void
  onAddEntry: (entry: PlanEntry) => void
}) {
  const [title, setTitle] = useState(existingEntry?.title ?? '')
  const [colorTag, setColorTag] = useState(existingEntry?.colorTag ?? PLAN_COLORS[0].hex)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/event/new', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Could not create event.')
        return
      }

      const entry: PlanEntry = {
        id: crypto.randomUUID(),
        date: format(date, 'yyyy-MM-dd'),
        eventRoomId: data.id,
        title: title.trim() || format(date, 'MMMM d'),
        colorTag,
        createdAt: Date.now(),
      }

      onAddEntry(entry)
      window.open(`/event/${data.id}`, '_blank')
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[oklch(0.18_0.02_50_/_0.45)] z-40"
        onClick={onClose}
      />

      {/* Dialog card */}
      <div
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
        style={{
          backgroundColor: 'oklch(0.975 0.008 60)',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, oklch(0.87 0.018 58 / 0.35) 31px, oklch(0.87 0.018 58 / 0.35) 32px)',
          borderRadius: '1px',
          boxShadow: '6px 6px 0px oklch(0.65 0.13 48)',
        }}
      >
        {/* Tape strip (uses selected color) */}
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-6 opacity-75 -rotate-1"
          style={{ backgroundColor: colorTag, borderRadius: '1px' }}
          aria-hidden
        />

        <div className="px-7 py-8 flex flex-col gap-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[oklch(0.6_0.025_55)] hover:text-[oklch(0.18_0.02_50)] transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>

          {/* Date header */}
          <div>
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.65_0.13_48)]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {format(date, 'EEEE, MMMM d · yyyy')}
            </span>
            <h2
              className="text-2xl mt-1 text-[oklch(0.18_0.02_50)]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {existingEntry ? existingEntry.title : 'New event'}
            </h2>
          </div>

          {existingEntry ? (
            /* ── Existing event view ── */
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[oklch(0.55_0.025_55)]">
                A canvas already exists for this day. Open it to continue decorating with your friends.
              </p>
              <a
                href={`/event/${existingEntry.eventRoomId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[oklch(0.28_0.04_45)] text-[oklch(0.97_0.008_60)] px-6 py-3 text-sm font-semibold hover:bg-[oklch(0.22_0.04_45)] transition-colors"
                style={{ borderRadius: '1px', boxShadow: '3px 3px 0px oklch(0.65 0.13 48)' }}
              >
                Open canvas
                <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            /* ── New event form ── */
            <>
              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[10px] uppercase tracking-widest text-[oklch(0.6_0.025_55)]"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  Event title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
                  placeholder={format(date, 'MMMM d')}
                  className="w-full border border-[oklch(0.87_0.018_58)] bg-transparent px-3 py-2.5 text-sm text-[oklch(0.18_0.02_50)] placeholder:text-[oklch(0.72_0.02_55)] outline-none focus:border-[oklch(0.65_0.13_48)] transition-colors"
                  style={{ borderRadius: '1px' }}
                  autoFocus
                />
              </div>

              {/* Color swatches */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-[10px] uppercase tracking-widest text-[oklch(0.6_0.025_55)]"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  Colour
                </label>
                <div className="flex gap-2.5">
                  {PLAN_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setColorTag(c.hex)}
                      title={c.label}
                      className="w-7 h-7 transition-transform hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: c.hex,
                        borderRadius: '1px',
                        outline: colorTag === c.hex ? '2px solid oklch(0.28 0.04 45)' : '2px solid transparent',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p
                  className="text-xs text-red-500"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {error}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-[oklch(0.28_0.04_45)] text-[oklch(0.97_0.008_60)] px-6 py-3.5 text-sm font-semibold hover:bg-[oklch(0.22_0.04_45)] disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ borderRadius: '1px', boxShadow: '3px 3px 0px oklch(0.65 0.13 48)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Open canvas
                    <ExternalLink size={13} />
                  </>
                )}
              </button>

              <p
                className="text-[10px] text-[oklch(0.65_0.025_55)] -mt-3"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                Opens in a new tab · link saved to your planner
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
