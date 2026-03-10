'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useStorage } from '@/lib/liveblocks'
import { CANVAS_THEMES } from '@/lib/types'
import { toPng } from 'html-to-image'
import { format, parseISO } from 'date-fns'
import { X, Download, Loader2 } from 'lucide-react'

interface EventExportOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Hex values per theme so the export card renders without oklch
const THEME_COLORS: Record<string, { bg: string; text: string; muted: string; rule: string; isDark: boolean }> = {
  'soft-milk':     { bg: '#faf8f4', text: '#2a2420', muted: '#7a6e64', rule: '#e0d4c0', isDark: false },
  'matcha-cafe':   { bg: '#f0f4ec', text: '#283828', muted: '#5a7050', rule: '#c4d8b4', isDark: false },
  'midnight-cafe': { bg: '#1a1a2e', text: '#e8e0f0', muted: '#9890b0', rule: '#38385a', isDark: true  },
  'soft-lofi':     { bg: '#f5ede4', text: '#2a2018', muted: '#7a6050', rule: '#dcc8a8', isDark: false },
  'archive-beige': { bg: '#f2ead8', text: '#2a2010', muted: '#7a6840', rule: '#cob898', isDark: false },
  'cloud-white':   { bg: '#f8f9fc', text: '#202430', muted: '#606880', rule: '#d0d8e8', isDark: false },
}

const CARD_WIDTH = 860

export function EventExportOverlay({ open, onOpenChange }: EventExportOverlayProps) {
  const metadata = useStorage((root) => root.metadata)
  const previewRef = useRef<HTMLDivElement>(null)

  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Capture the live canvas as soon as the overlay opens
  useEffect(() => {
    if (!open) return
    setCanvasSnapshot(null)
    setIsCapturing(true)

    const el = document.getElementById('event-canvas')
    if (!el) { setIsCapturing(false); return }

    // Brief delay lets any animation settle
    const timer = setTimeout(async () => {
      try {
        const dataUrl = await toPng(el as HTMLElement, { pixelRatio: 2, skipAutoScale: true })
        setCanvasSnapshot(dataUrl)
      } catch (err) {
        console.error('Canvas capture failed:', err)
      } finally {
        setIsCapturing(false)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [open])

  const handleDownload = useCallback(async () => {
    if (!previewRef.current || !canvasSnapshot) return
    setIsDownloading(true)
    try {
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        skipAutoScale: true,
        // Ensure we capture the full card even if scrolled
        width: previewRef.current.scrollWidth,
        height: previewRef.current.scrollHeight,
      })
      const link = document.createElement('a')
      link.download = `daymark-event-${metadata?.date ?? 'memory'}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }, [canvasSnapshot, metadata])

  if (!open || !metadata) return null

  const theme = metadata.canvasTheme
  const colors = THEME_COLORS[theme] ?? THEME_COLORS['soft-milk']
  const themeConfig = CANVAS_THEMES.find((t) => t.id === theme)
  const accent = metadata.colorTag || themeConfig?.accentColors[0] || '#c8a876'

  // Format date + time display
  let dateLine = ''
  let dayLine = ''
  try {
    const d = parseISO(metadata.date)
    dateLine = format(d, 'MMMM d, yyyy')
    dayLine = format(d, 'EEEE')
  } catch { /* ignore */ }

  const hasTime = metadata.startTime || metadata.endTime
  const timeStr = [metadata.startTime, metadata.endTime].filter(Boolean).join(' – ')

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex flex-col items-center overflow-y-auto py-10 px-4">
      {/* Controls bar */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <span className="font-mono text-xs text-white/50 tracking-widest uppercase">Export preview</span>
        <button
          onClick={handleDownload}
          disabled={!canvasSnapshot || isDownloading}
          style={{ backgroundColor: accent }}
          className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {isDownloading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            : <><Download className="w-3.5 h-3.5" /> Download PNG</>
          }
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="p-1.5 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* === EXPORT CARD (this is what gets captured) === */}
      <div
        ref={previewRef}
        style={{
          width: CARD_WIDTH,
          backgroundColor: colors.bg,
          color: colors.text,
          fontFamily: 'Georgia, "Times New Roman", serif',
          overflow: 'hidden',
        }}
        className="rounded-xl shadow-2xl shrink-0"
      >
        {/* Accent top bar */}
        <div style={{ height: 5, backgroundColor: accent }} />

        {/* Header row */}
        <div style={{ padding: '18px 32px 14px', borderBottom: `1px solid ${colors.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic', color: colors.muted, letterSpacing: '0.04em' }}>
            ✦ event memory
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: colors.muted, letterSpacing: '0.12em' }}>
            DAYMARK
          </span>
        </div>

        {/* Canvas snapshot */}
        <div style={{ width: '100%', position: 'relative', backgroundColor: colors.isDark ? '#0f0f1e' : '#e8e0d4' }}>
          {isCapturing && (
            <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.muted }} />
            </div>
          )}
          {canvasSnapshot && (
            <img
              src={canvasSnapshot}
              alt="Event canvas"
              style={{ width: '100%', display: 'block' }}
              draggable={false}
            />
          )}
        </div>

        {/* Metadata section */}
        <div style={{ padding: '32px 40px 28px' }}>

          {/* Color tag dot + title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: accent, marginTop: 8, flexShrink: 0 }} />
            <h1 style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
              color: colors.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              {metadata.title || 'Untitled event'}
            </h1>
          </div>

          {/* Date / time / location row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', marginBottom: 20, paddingLeft: 22 }}>
            {dateLine && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Calendar stamp */}
                <span style={{ fontFamily: 'monospace', fontSize: 10, padding: '2px 6px', border: `1px solid ${accent}`, borderRadius: 3, color: accent, letterSpacing: '0.05em' }}>
                  {dayLine.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: colors.muted, letterSpacing: '0.02em' }}>
                  {dateLine}
                </span>
              </div>
            )}
            {hasTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: colors.muted }}>⏱</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: colors.muted }}>{timeStr}</span>
              </div>
            )}
            {metadata.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: colors.muted }}>📍</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: colors.muted }}>{metadata.location}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {metadata.notes && (
            <div style={{
              paddingLeft: 22,
              borderLeft: `2px solid ${accent}44`,
              marginLeft: 0,
              marginBottom: 24,
            }}>
              <p style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.7,
                color: colors.muted,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {metadata.notes}
              </p>
            </div>
          )}

          {/* Divider + footer */}
          <div style={{ borderTop: `1px solid ${colors.rule}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: colors.muted, letterSpacing: '0.1em' }}>
              daymark.app
            </span>
            {dateLine && (
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: colors.muted }}>
                {dateLine}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom padding for scroll breathing room */}
      <div className="h-10 shrink-0" />
    </div>
  )
}
