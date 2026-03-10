'use client'

import { useState } from 'react'
import { MetadataPanel } from './MetadataPanel'
import { EventStickersPanel } from './EventStickersPanel'
import { EventCanvas } from './EventCanvas'
import { EventToolbar } from './EventToolbar'
import { PresenceBar } from './PresenceBar'
import { ShareButton } from './ShareButton'
import { LiveCursors } from './LiveCursors'
import { WebcamTile } from './WebcamTile'
import { PhotoBoothOverlay } from './PhotoBoothOverlay'
import { EventPhotoboothModal } from './EventPhotoboothModal'
import { useStorage, useSelf } from '@/lib/liveblocks'
import { cn } from '@/lib/utils'

interface EventPageProps {
  eventId: string
}

export function EventPage({ eventId }: EventPageProps) {
  const metadata = useStorage((root) => root.metadata)
  const self = useSelf()
  const [showPhotoBooth, setShowPhotoBooth] = useState(false)
  const [showSoloStrip, setShowSoloStrip] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [activeWashiColor, setActiveWashiColor] = useState('#f4c2c2')
  const [activeHighlightColor, setActiveHighlightColor] = useState('#fef08a')
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<'stickers' | 'details'>('stickers')

  if (!metadata) return null

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-11 border-b border-border px-4 flex items-center justify-between bg-card shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-base font-semibold tracking-tight shrink-0">DayMark</span>
          <span className="text-border">·</span>
          <h1 className="font-serif text-sm text-foreground/80 truncate">
            {metadata.title || 'Untitled event'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PresenceBar />
          <ShareButton />
          <button
            onClick={() => setShowSoloStrip(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground font-mono text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            🎞️ Solo strip
          </button>
          <button
            onClick={() => setShowPhotoBooth(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-mono text-xs font-medium hover:bg-accent/90 transition-colors"
          >
            📸 Photo together
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <EventToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          selectedElementId={selectedElementId}
          onDeselect={() => setSelectedElementId(null)}
          activeWashiColor={activeWashiColor}
          activeHighlightColor={activeHighlightColor}
        />

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <EventCanvas
            activeTool={activeTool}
            activeWashiColor={activeWashiColor}
            activeHighlightColor={activeHighlightColor}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            canvasTheme={metadata.canvasTheme}
            date={metadata.date}
          />
          <LiveCursors />
        </div>

        {/* Right panel */}
        <aside className="w-[280px] border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(['stickers', 'details'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={cn(
                  'flex-1 py-2 font-mono text-xs transition-colors',
                  rightTab === tab
                    ? 'text-foreground border-b-2 border-accent'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'stickers' ? 'Stickers' : 'Details'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === 'stickers' ? (
              <EventStickersPanel />
            ) : (
              <MetadataPanel
                activeWashiColor={activeWashiColor}
                onWashiColorChange={setActiveWashiColor}
                activeHighlightColor={activeHighlightColor}
                onHighlightColorChange={setActiveHighlightColor}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Live webcam tile */}
      <WebcamTile />

      {/* Solo 4-shot strip */}
      <EventPhotoboothModal
        open={showSoloStrip}
        onOpenChange={setShowSoloStrip}
      />

      {/* Photo booth overlay */}
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
