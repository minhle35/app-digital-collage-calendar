'use client'

import { useState } from 'react'
import { EventCanvas } from './EventCanvas'
import { EventToolbar } from './EventToolbar'
import { EventTimeline } from './EventTimeline'
import { MomentsThread } from './MomentsThread'
import { MetadataPanel } from './MetadataPanel'
import { EventStickersPanel } from './EventStickersPanel'
import { EventPhotosPanel } from './EventPhotosPanel'
import { PresenceBar } from './PresenceBar'
import { ShareButton } from './ShareButton'
import { LiveCursors } from './LiveCursors'
import { WebcamTile } from './WebcamTile'
import { PhotoBoothOverlay } from './PhotoBoothOverlay'
import { EventPhotoboothModal } from './EventPhotoboothModal'
import { EventExportOverlay } from './EventExportOverlay'
import { useStorage, useSelf } from '@/lib/liveblocks'
import { cn } from '@/lib/utils'

interface EventPageProps {
  eventId: string
}

export interface PageTheme {
  id: string
  name: string
  body: string     // outermost bg
  wrapper: string  // canvas area bg
  header: string   // header bg
}

export interface SidebarTheme {
  id: string
  name: string
  bg: string
  dot: string
}

export const SIDEBAR_THEMES: SidebarTheme[] = [
  { id: 'paper-warm',  name: 'Paper Warm',  bg: '#fdf9f4', dot: '#d8d0c4' },
  { id: 'paper-white', name: 'Paper',       bg: '#fbfaf9', dot: '#d1cfcd' },
  { id: 'peach-mist',  name: 'Peach Mist',  bg: '#fef6f2', dot: '#e0c8c0' },
  { id: 'blush-mist',  name: 'Blush Mist',  bg: '#fff4f4', dot: '#e8c8c8' },
  { id: 'golden-mist', name: 'Golden Mist', bg: '#fdf8f0', dot: '#d8c0a0' },
]

export const PAGE_THEMES: PageTheme[] = [
  {
    id: 'milk-tea-default',
    name: 'Milk Tea',
    body:    '#f7f2eb',
    wrapper: '#f0e8dc',
    header:  '#fdf9f4',
  },
  {
    id: 'peach-bloom',
    name: 'Peach Bloom',
    body:    '#faeae4',
    wrapper: '#f5d8d0',
    header:  '#fef4f0',
  },
  {
    id: 'blush-petal',
    name: 'Blush Petal',
    body:    '#ffe8e8',
    wrapper: '#ffd8d8',
    header:  '#fff4f4',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    body:    '#f8ece0',
    wrapper: '#f0d8c0',
    header:  '#fdf8f0',
  },
]

// Diamond logo SVG
function DiamondLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2L17 8.5L10 18L3 8.5L10 2Z"
        fill="#c8a874"
        stroke="#c8a874"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5H17M10 2L7 8.5L10 18L13 8.5L10 2Z"
        stroke="#fff"
        strokeWidth="0.6"
        strokeOpacity="0.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatDisplayDate(isoDate: string) {
  if (!isoDate) return { day: '—', month: '', year: '' }
  const d = new Date(isoDate + 'T12:00:00')
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
    year: d.getFullYear().toString(),
  }
}

export function EventPage({ eventId }: EventPageProps) {
  const metadata = useStorage((root) => root.metadata)
  const self = useSelf()

  const [pageTheme, setPageTheme] = useState<PageTheme>(PAGE_THEMES[0])
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(SIDEBAR_THEMES[1])

  const [showPhotoBooth, setShowPhotoBooth] = useState(false)
  const [showSoloStrip, setShowSoloStrip] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [activeWashiColor, setActiveWashiColor] = useState('#f4c2c2')
  const [activeHighlightColor, setActiveHighlightColor] = useState('#fef08a')
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<'stickers' | 'photos' | 'details'>('stickers')
  const [showRightPanel, setShowRightPanel] = useState(false)

  if (!metadata) return null

  const { day, year } = formatDisplayDate(metadata.date)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: pageTheme.body }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-5 py-3 border-b z-20"
        style={{ backgroundColor: pageTheme.header, borderColor: '#e8ddd0' }}
      >
        {/* Left: logo + date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DiamondLogo />
            <span className="font-serif text-sm font-semibold tracking-tight" style={{ color: '#2a2420' }}>
              DayMark
            </span>
          </div>

          <div className="h-4 w-px" style={{ backgroundColor: '#ddd4c0' }} />

          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-sm font-medium" style={{ color: '#3a3028' }}>
              {metadata.title || 'Untitled event'}
            </h1>
            {day && (
              <>
                <span className="font-mono text-xs" style={{ color: '#c8a874' }}>·</span>
                <span className="font-mono text-xs" style={{ color: '#8a7a6a' }}>{day}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: '#c8a874' }}>{year}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: presence + actions */}
        <div className="flex items-center gap-2.5">
          <PresenceBar />

          <div className="h-4 w-px" style={{ backgroundColor: '#ddd4c0' }} />

          <ShareButton />

          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs transition-colors border"
            style={{ borderColor: '#e0d4c0', color: '#6b5e4e', backgroundColor: '#faf6f0' }}
          >
            ⬇ Download
          </button>

          <button
            onClick={() => setShowSoloStrip(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs transition-colors border"
            style={{ borderColor: '#e0d4c0', color: '#6b5e4e', backgroundColor: '#faf6f0' }}
          >
            🎞️ Solo strip
          </button>

          <button
            onClick={() => setShowPhotoBooth(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: '#c8a874' }}
          >
            📸 Photo together
          </button>

          {/* Toggle right panel */}
          <button
            onClick={() => setShowRightPanel((v) => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors"
            style={{
              borderColor: showRightPanel ? '#c8a874' : '#e0d4c0',
              backgroundColor: showRightPanel ? '#f5ede0' : '#faf6f0',
              color: '#8a7a6a',
            }}
            title="Toggle edit panel"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
              <rect x="1" y="2" width="11" height="1.5" rx="0.75" />
              <rect x="1" y="5.75" width="7" height="1.5" rx="0.75" />
              <rect x="1" y="9.5" width="9" height="1.5" rx="0.75" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Timeline sidebar */}
        <EventTimeline sidebarTheme={sidebarTheme} />

        {/* Center: Canvas row + Thread stacked */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Canvas row: vertical toolbar left + canvas right */}
          <div className="flex-1 flex overflow-hidden">
            <EventToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              selectedElementId={selectedElementId}
              onDeselect={() => setSelectedElementId(null)}
              activeWashiColor={activeWashiColor}
              activeHighlightColor={activeHighlightColor}
            />

            {/* Canvas area with grain texture */}
            <div
              className="flex-1 relative overflow-auto flex items-center justify-center p-4"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                backgroundColor: pageTheme.wrapper,
              }}
            >
              <div className="relative">
                <EventCanvas
                  activeTool={activeTool}
                  activeWashiColor={activeWashiColor}
                  activeHighlightColor={activeHighlightColor}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  canvasTheme={metadata.canvasTheme}
                  canvasStyle={(metadata.canvasStyle ?? 'ruled') as import('@/lib/types').CanvasStyle}
                  date={metadata.date}
                />
                <LiveCursors />

                {/* Canvas hover controls */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowExport(true)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm border"
                    style={{ backgroundColor: '#fdf9f4', borderColor: '#e0d4c0', color: '#8a7a6a' }}
                    title="Download canvas"
                  >
                    ⬇
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Moments Thread */}
          <MomentsThread />
        </div>

        {/* Right: Edit panel (stickers + details) — toggleable */}
        {showRightPanel && (
          <aside
            className="w-[280px] border-l flex flex-col shrink-0 overflow-hidden"
            style={{ borderColor: '#e8ddd0', backgroundColor: '#fdf9f4' }}
          >
            {/* Tabs */}
            <div className="flex border-b shrink-0" style={{ borderColor: '#e8ddd0' }}>
              {(['stickers', 'photos', 'details'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={cn(
                    'flex-1 py-2.5 font-mono text-xs transition-colors',
                    rightTab === tab
                      ? 'border-b-2 font-medium'
                      : 'hover:opacity-80'
                  )}
                  style={
                    rightTab === tab
                      ? { color: '#c8a874', borderColor: '#c8a874' }
                      : { color: '#a09080' }
                  }
                >
                  {tab === 'stickers' ? 'Stickers' : tab === 'photos' ? 'Photos' : 'Details'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {rightTab === 'stickers' ? (
                <EventStickersPanel />
              ) : rightTab === 'photos' ? (
                <EventPhotosPanel />
              ) : (
                <MetadataPanel
                  activeWashiColor={activeWashiColor}
                  onWashiColorChange={setActiveWashiColor}
                  activeHighlightColor={activeHighlightColor}
                  onHighlightColorChange={setActiveHighlightColor}
                  pageTheme={pageTheme}
                  onPageThemeChange={setPageTheme}
                  sidebarTheme={sidebarTheme}
                  onSidebarThemeChange={setSidebarTheme}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Live webcam tile */}
      <WebcamTile />

      {/* Overlays */}
      <EventExportOverlay open={showExport} onOpenChange={setShowExport} />
      <EventPhotoboothModal open={showSoloStrip} onOpenChange={setShowSoloStrip} />
      {showPhotoBooth && (
        <PhotoBoothOverlay
          onClose={() => setShowPhotoBooth(false)}
          selfName={self?.presence.name ?? 'You'}
          canvasTheme={metadata.canvasTheme}
        />
      )}
    </div>
  )
}
