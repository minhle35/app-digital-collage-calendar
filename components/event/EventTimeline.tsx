'use client'

import { useState, useRef } from 'react'
import { useStorage, useMutation, useSelf } from '@/lib/liveblocks'
import type { MomentType, TimelineMoment } from '@/lib/event-types'
import { cn } from '@/lib/utils'

const MOMENT_ICONS: Record<MomentType, string> = {
  reflection: '💭',
  capture:    '📸',
  note:       '📝',
  collaboration: '🤝',
}

const MOMENT_COLORS: Record<MomentType, string> = {
  reflection:    '#c8a874',
  capture:       '#7b8db8',
  note:          '#6b9e78',
  collaboration: '#c4726a',
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

/** Formats "HH:MM" from a Date */
function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface AddMomentFormProps {
  onAdd: (type: MomentType, content: string) => void
  onCancel: () => void
}

function AddMomentForm({ onAdd, onCancel }: AddMomentFormProps) {
  const [type, setType] = useState<MomentType>('note')
  const [content, setContent] = useState('')

  return (
    <div className="p-3 border border-[#c8a874]/30 rounded-lg bg-[#faf8f4] space-y-2">
      <div className="flex gap-1 flex-wrap">
        {(Object.keys(MOMENT_ICONS) as MomentType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'px-2 py-0.5 rounded-full font-mono text-[10px] transition-colors',
              type === t
                ? 'text-white'
                : 'bg-black/5 text-[#6b5e4e] hover:bg-black/10'
            )}
            style={type === t ? { backgroundColor: MOMENT_COLORS[t] } : {}}
          >
            {MOMENT_ICONS[t]} {t}
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening right now…"
        rows={2}
        className="w-full text-xs font-mono resize-none rounded border border-[#c8a874]/20 bg-white px-2 py-1.5 text-[#2a2420] placeholder:text-[#a09080] focus:outline-none focus:ring-1 focus:ring-[#c8a874]/40"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 text-[10px] font-mono text-[#a09080] hover:text-[#6b5e4e] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { if (content.trim()) onAdd(type, content.trim()) }}
          disabled={!content.trim()}
          className="px-2.5 py-1 text-[10px] font-mono rounded bg-[#c8a874] text-white disabled:opacity-40 hover:bg-[#b8986a] transition-colors"
        >
          Add moment
        </button>
      </div>
    </div>
  )
}

export function EventTimeline() {
  const rawMoments = useStorage((root) => root.moments)
  // moments are stored as JSON strings to satisfy Liveblocks LsonObject constraint
  const moments: TimelineMoment[] = (rawMoments ?? []).flatMap((s) => {
    try { return [JSON.parse(s) as TimelineMoment] } catch { return [] }
  })
  const self = useSelf()
  const [showForm, setShowForm] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const addMoment = useMutation(({ storage }, type: MomentType, content: string) => {
    const moment: TimelineMoment = {
      id: generateId(),
      type,
      time: nowTime(),
      content,
      authorName: self?.presence.name ?? 'Guest',
      createdAt: Date.now(),
    }
    storage.get('moments').push(JSON.stringify(moment))
  }, [self])

  const handleAdd = (type: MomentType, content: string) => {
    addMoment(type, content)
    setShowForm(false)
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  // Build 24-hour slots; show only those with moments plus nearest context
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const currentHour = new Date().getHours()
  const currentMin = new Date().getMinutes()

  // Group moments by hour
  const byHour: Record<number, TimelineMoment[]> = {}
  if (moments) {
    for (const m of moments) {
      const h = parseInt(m.time.split(':')[0], 10)
      if (!byHour[h]) byHour[h] = []
      byHour[h].push(m)
    }
  }

  const hoursToShow = new Set<number>()
  hours.forEach((h) => {
    if (byHour[h]?.length) {
      hoursToShow.add(h - 1)
      hoursToShow.add(h)
      hoursToShow.add(h + 1)
    }
  })
  // Always show current hour ±1
  hoursToShow.add(currentHour - 1)
  hoursToShow.add(currentHour)
  hoursToShow.add(currentHour + 1)

  return (
    <aside className="w-[280px] border-r flex flex-col shrink-0 overflow-hidden"
      style={{ borderColor: '#e8ddd0', backgroundColor: '#fdf9f4' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between"
        style={{ borderColor: '#e8ddd0' }}>
        <span className="font-mono text-xs font-semibold tracking-widest uppercase"
          style={{ color: '#c8a874' }}>
          Timeline
        </span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs font-mono rounded-full w-5 h-5 flex items-center justify-center transition-colors"
          style={{ color: '#c8a874' }}
          title="Add moment"
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: '#e8ddd0' }}>
          <AddMomentForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Scrollable timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative px-0 py-2">
          {/* Vertical axis line */}
          <div
            className="absolute left-[52px] top-0 bottom-0 w-px"
            style={{ backgroundColor: '#e8ddd0' }}
          />

          {hours.map((h) => {
            if (!hoursToShow.has(h)) return null
            const isCurrent = h === currentHour
            const hasMoments = (byHour[h]?.length ?? 0) > 0

            return (
              <div key={h} className="relative mb-0">
                {/* Time label row */}
                <div className="flex items-center" style={{ minHeight: isCurrent && !hasMoments ? 36 : hasMoments ? 28 : 24 }}>
                  <span
                    className="w-[52px] text-right pr-3 font-mono text-[10px] shrink-0"
                    style={{ color: isCurrent ? '#c8a874' : '#b0a090' }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>

                  {/* Current time red dot */}
                  {isCurrent && (
                    <div className="relative flex items-center w-full">
                      <div
                        className="w-2 h-2 rounded-full z-10 shrink-0"
                        style={{
                          backgroundColor: '#e05252',
                          marginTop: `${(currentMin / 60) * 24}px`,
                        }}
                      />
                      <div
                        className="flex-1 h-px ml-1"
                        style={{
                          backgroundColor: '#e05252',
                          opacity: 0.3,
                          marginTop: `${(currentMin / 60) * 24}px`,
                        }}
                      />
                    </div>
                  )}
                  {!isCurrent && (
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: hasMoments ? '#c8a874' : '#ddd4c0' }}
                    />
                  )}
                </div>

                {/* Moment cards for this hour */}
                {byHour[h]?.map((moment) => (
                  <div key={moment.id} className="flex items-start ml-[52px] mb-2">
                    <div className="w-px self-stretch mx-0 mr-2 shrink-0" style={{ backgroundColor: '#e8ddd0' }} />
                    <div
                      className="flex-1 rounded-lg p-2.5 ml-1 shadow-sm border"
                      style={{
                        backgroundColor: '#fff',
                        borderColor: '#ede4d8',
                        borderLeftWidth: 2,
                        borderLeftColor: MOMENT_COLORS[moment.type],
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{MOMENT_ICONS[moment.type]}</span>
                        <span className="font-mono text-[9px]" style={{ color: MOMENT_COLORS[moment.type] }}>
                          {moment.type}
                        </span>
                        <span className="font-mono text-[9px] ml-auto" style={{ color: '#b0a090' }}>
                          {moment.time}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] leading-relaxed" style={{ color: '#3a3028' }}>
                        {moment.content}
                      </p>
                      <p className="font-mono text-[9px] mt-1" style={{ color: '#b0a090' }}>
                        {moment.authorName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
