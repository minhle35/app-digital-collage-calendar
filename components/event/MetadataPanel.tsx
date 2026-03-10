'use client'

import { useStorage, useMutation } from '@/lib/liveblocks'
import { CANVAS_THEMES, CANVAS_STYLES } from '@/lib/types'
import type { CanvasTheme } from '@/lib/types'
import type { EventMetadata } from '@/lib/event-types'
import { PAGE_THEMES, type PageTheme } from './EventPage'
import { cn } from '@/lib/utils'

const WASHI_COLOURS = ['#f4c2c2', '#b5c9a8', '#aac4d0', '#c9b8d8', '#f0e08a', '#f4c9a8']
const HIGHLIGHT_COLOURS = ['#fef08a', '#fbcfe8', '#bbf7d0', '#bfdbfe', '#fed7aa', '#e9d5ff']
const TAG_COLOURS = ['#c8a876', '#e07b54', '#6b9e78', '#7b8db8', '#9b7bb8', '#5fa8a0']

interface MetadataPanelProps {
  activeWashiColor: string
  onWashiColorChange: (c: string) => void
  activeHighlightColor: string
  onHighlightColorChange: (c: string) => void
  pageTheme: PageTheme
  onPageThemeChange: (t: PageTheme) => void
}

export function MetadataPanel({
  activeWashiColor, onWashiColorChange,
  activeHighlightColor, onHighlightColorChange,
  pageTheme, onPageThemeChange,
}: MetadataPanelProps) {
  const metadata = useStorage((root) => root.metadata)

  const updateMetadata = useMutation(({ storage }, updates: Partial<EventMetadata>) => {
    const meta = storage.get('metadata')
    Object.entries(updates).forEach(([k, v]) => meta.set(k as never, v as never))
  }, [])

  if (!metadata) return null

  return (
    <aside className="w-[280px] border-l border-border bg-card flex flex-col overflow-y-auto shrink-0">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Event details</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Title */}
        <Field label="Title">
          <input
            className="w-full bg-transparent font-serif text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border/40 focus:border-accent pb-1 transition-colors"
            value={metadata.title}
            placeholder="Event title"
            onChange={(e) => updateMetadata({ title: e.target.value })}
          />
        </Field>

        {/* Date */}
        <Field label="Date">
          <input
            type="date"
            className="w-full bg-transparent font-mono text-xs text-foreground outline-none border-b border-border/40 focus:border-accent pb-1 transition-colors"
            value={metadata.date}
            onChange={(e) => updateMetadata({ date: e.target.value })}
          />
        </Field>

        {/* Time range */}
        <Field label="Time">
          <div className="flex items-center gap-2">
            <input
              type="time"
              className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none border-b border-border/40 focus:border-accent pb-1 transition-colors"
              value={metadata.startTime}
              onChange={(e) => updateMetadata({ startTime: e.target.value })}
            />
            <span className="font-mono text-xs text-muted-foreground">→</span>
            <input
              type="time"
              className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none border-b border-border/40 focus:border-accent pb-1 transition-colors"
              value={metadata.endTime}
              onChange={(e) => updateMetadata({ endTime: e.target.value })}
            />
          </div>
        </Field>

        {/* Location */}
        <Field label="Location">
          <input
            className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border/40 focus:border-accent pb-1 transition-colors"
            value={metadata.location}
            placeholder="Add location"
            onChange={(e) => updateMetadata({ location: e.target.value })}
          />
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed"
            value={metadata.notes}
            placeholder="Add notes…"
            rows={3}
            onChange={(e) => updateMetadata({ notes: e.target.value })}
          />
        </Field>

        {/* Colour tag */}
        <Field label="Colour">
          <div className="flex gap-2 flex-wrap">
            {TAG_COLOURS.map((c) => (
              <button
                key={c}
                onClick={() => updateMetadata({ colorTag: c })}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all',
                  metadata.colorTag === c ? 'border-foreground scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>

        {/* Workspace background */}
        <Field label="Workspace bg">
          <div className="grid grid-cols-2 gap-1.5">
            {PAGE_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onPageThemeChange(t)}
                className={cn(
                  'h-8 rounded text-[10px] font-mono transition-all border flex items-center gap-1.5 px-2',
                  pageTheme.id === t.id
                    ? 'border-accent ring-1 ring-accent'
                    : 'border-border/30 hover:border-border'
                )}
                style={{ backgroundColor: t.body }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: t.wrapper }}
                />
                <span style={{ color: '#5a4a3a' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* Canvas theme */}
        <Field label="Canvas theme">
          <div className="grid grid-cols-3 gap-1.5">
            {CANVAS_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateMetadata({ canvasTheme: t.id as CanvasTheme })}
                className={cn(
                  'h-8 rounded text-[10px] font-mono transition-all border',
                  t.bgClass,
                  t.textClass,
                  metadata.canvasTheme === t.id
                    ? 'border-accent ring-1 ring-accent'
                    : 'border-border/30'
                )}
              >
                {t.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </Field>

        {/* Canvas style */}
        <Field label="Paper style">
          <div className="grid grid-cols-4 gap-1.5">
            {CANVAS_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => updateMetadata({ canvasStyle: s.id })}
                className={cn(
                  'h-9 rounded text-xs font-mono transition-all border flex flex-col items-center justify-center gap-0.5',
                  metadata.canvasStyle === s.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border/30 text-muted-foreground hover:border-border hover:bg-secondary/40'
                )}
                title={s.name}
              >
                <span className="text-sm leading-none">{s.icon}</span>
                <span className="text-[9px]">{s.name}</span>
              </button>
            ))}
          </div>
        </Field>

        <div className="border-t border-border/40 pt-4 space-y-4">
          {/* Washi colours */}
          <Field label="Washi tape">
            <div className="flex gap-2 flex-wrap">
              {WASHI_COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => onWashiColorChange(c)}
                  className={cn(
                    'w-5 h-5 rounded-sm border-2 transition-all',
                    activeWashiColor === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c, opacity: 0.8 }}
                />
              ))}
            </div>
          </Field>

          {/* Highlight colours */}
          <Field label="Highlighter">
            <div className="flex gap-2 flex-wrap">
              {HIGHLIGHT_COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => onHighlightColorChange(c)}
                  className={cn(
                    'w-5 h-5 rounded border-2 transition-all',
                    activeHighlightColor === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
        </div>
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}
