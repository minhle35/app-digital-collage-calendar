'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, format, parseISO } from 'date-fns'
import { X, CalendarDays, Loader2 } from 'lucide-react'

function buildMonthOptions(count = 14) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(now, i - 1) // start one month back
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
  })
}

export function MonthRangeDialog({
  buttonLabel,
  buttonClassName,
  buttonStyle,
}: {
  buttonLabel: string
  buttonClassName?: string
  buttonStyle?: React.CSSProperties
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const monthOptions = useMemo(() => buildMonthOptions(), [])

  const defaultStart = monthOptions[1].value  // current month
  const defaultEnd   = monthOptions[4].value  // +3 months

  const [startMonth, setStartMonth] = useState(defaultStart)
  const [endMonth, setEndMonth]     = useState(defaultEnd)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // End options: start+1 through start+6 (max 6-month span)
  const endOptions = useMemo(() => {
    const idx = monthOptions.findIndex((m) => m.value === startMonth)
    return monthOptions.slice(idx + 1, idx + 7)
  }, [startMonth, monthOptions])

  function handleStartChange(val: string) {
    setStartMonth(val)
    const idx = monthOptions.findIndex((m) => m.value === val)
    const opts = monthOptions.slice(idx + 1, idx + 7)
    if (!opts.find((m) => m.value === endMonth)) {
      setEndMonth(opts[2]?.value ?? opts[0]?.value ?? val)
    }
  }

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/monthly-plan/new', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Could not create planner.')
        return
      }
      router.push(`/monthly-plan/${data.id}?start=${startMonth}&end=${endMonth}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectCls =
    'w-full border border-[oklch(0.87_0.018_58)] bg-[oklch(0.995_0.004_65)] px-3 py-2.5 text-[oklch(0.18_0.02_50)] outline-none focus:border-[oklch(0.65_0.13_48)] transition-colors cursor-pointer'

  const selectSty: React.CSSProperties = {
    borderRadius: '1px',
    fontFamily: 'var(--font-space-mono)',
    fontSize: '11px',
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setError(null); setOpen(true) }}
        className={buttonClassName}
        style={buttonStyle}
      >
        {buttonLabel}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[oklch(0.18_0.02_50_/_0.5)] z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
            style={{
              backgroundColor: 'oklch(0.975 0.008 60)',
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 31px, oklch(0.87 0.018 58 / 0.35) 31px, oklch(0.87 0.018 58 / 0.35) 32px)',
              borderRadius: '1px',
              boxShadow: '6px 6px 0px oklch(0.65 0.13 48)',
            }}
          >
            {/* Tape */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 opacity-75 rotate-1"
              style={{ backgroundColor: '#b8cff5', borderRadius: '1px' }}
              aria-hidden
            />

            <div className="px-8 py-9 flex flex-col gap-6">
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-[oklch(0.6_0.025_55)] hover:text-[oklch(0.18_0.02_50)] transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>

              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-[oklch(0.65_0.13_48)]" />
                  <span
                    className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.65_0.13_48)]"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    Monthly planner
                  </span>
                </div>
                <h2
                  className="text-2xl text-[oklch(0.18_0.02_50)]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Pick your months
                </h2>
                <p className="text-xs text-[oklch(0.55_0.025_55)] leading-relaxed">
                  Up to 6 months. You'll get a unique link — bookmark it or send
                  it to yourself to come back any time.
                </p>
              </div>

              {/* Month selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[10px] uppercase tracking-widest text-[oklch(0.6_0.025_55)]"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    From
                  </label>
                  <select
                    value={startMonth}
                    onChange={(e) => handleStartChange(e.target.value)}
                    className={selectCls}
                    style={selectSty}
                  >
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[10px] uppercase tracking-widest text-[oklch(0.6_0.025_55)]"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    To
                  </label>
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className={selectCls}
                    style={selectSty}
                  >
                    {endOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Range preview chip */}
              <div
                className="flex items-center gap-2 text-[11px] text-[oklch(0.55_0.025_55)] bg-[oklch(0.93_0.02_65)] px-3 py-2"
                style={{ borderRadius: '1px', fontFamily: 'var(--font-space-mono)' }}
              >
                <CalendarDays size={11} className="shrink-0" />
                <span>
                  {format(parseISO(`${startMonth}-01`), 'MMM d, yyyy')}
                  {' → '}
                  {format(parseISO(`${endMonth}-01`), 'MMM d, yyyy')}
                </span>
              </div>

              {error && (
                <p
                  className="text-xs text-red-500 -mt-2"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-[oklch(0.28_0.04_45)] text-[oklch(0.97_0.008_60)] px-7 py-3.5 text-sm font-semibold hover:bg-[oklch(0.22_0.04_45)] disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ borderRadius: '1px', boxShadow: '4px 4px 0px oklch(0.65 0.13 48)' }}
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Creating…</>
                ) : (
                  'Create planner →'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
