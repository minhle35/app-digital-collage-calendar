'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import {
  STICKER_PACKS,
  WASHI_COLORS,
  HIGHLIGHT_COLORS,
  searchStickers,
  generateElementId,
  type StickerCategory,
  type StickerElement,
  type WashiElement,
  type HighlightElement,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronRight, Search, X, Leaf, Heart, Sparkles, Tag, Frame, Grid3X3, Highlighter, Scissors } from 'lucide-react'

const CATEGORY_ICONS: Record<StickerCategory, React.ReactNode> = {
  decorative: <Sparkles className="w-3 h-3" />,
  frames: <Frame className="w-3 h-3" />,
  'text-labels': <Tag className="w-3 h-3" />,
  nature: <Leaf className="w-3 h-3" />,
  symbols: <Grid3X3 className="w-3 h-3" />,
}

// Random safe placement within canvas (same logic as Canvas.tsx)
const CANVAS_W = 820
const CANVAS_H = 620
function safePlacement(elSize: number) {
  const margin = 0.15
  const minX = CANVAS_W * margin
  const maxX = CANVAS_W * (1 - margin) - elSize
  const minY = CANVAS_H * margin
  const maxY = CANVAS_H * (1 - margin) - elSize
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    rotation: (Math.random() - 0.5) * 14,
  }
}

type PanelTab = 'stickers' | 'washi' | 'highlights'

export function StickersPanel() {
  const { state, dispatch } = useDayMark()
  const [activeTab, setActiveTab] = useState<PanelTab>('stickers')
  const [activeCategory, setActiveCategory] = useState<StickerCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentPack = STICKER_PACKS.find((p) => p.id === state.stickerPack)!

  // Determine displayed stickers
  const displayedStickers = searchQuery.trim()
    ? searchStickers(STICKER_PACKS, searchQuery)
    : activeCategory === 'all'
      ? currentPack.stickers
      : currentPack.stickers.filter((s) => s.category === activeCategory)

  const handleStickerClick = useCallback(
    (stickerId: string) => {
      const sticker = STICKER_PACKS.flatMap((p) => p.stickers).find((s) => s.id === stickerId)
      if (!sticker) return
      const { x, y, rotation } = safePlacement(72)
      const el: StickerElement = {
        id: generateElementId(),
        type: 'sticker',
        x,
        y,
        width: 72,
        height: 72,
        rotation,
        zIndex: state.elements.length,
        locked: false,
        stickerId: sticker.id,
        category: sticker.category,
        isNew: true,
      }
      dispatch({ type: 'ADD_ELEMENT', element: el })
      dispatch({ type: 'SET_TOOL', tool: 'select' })
    },
    [dispatch, state.elements.length]
  )

  const handleWashiClick = useCallback(
    (color: string) => {
      dispatch({ type: 'SET_WASHI_COLOR', color })
      dispatch({ type: 'SET_TOOL', tool: 'washi' })
    },
    [dispatch]
  )

  const handleHighlightClick = useCallback(
    (color: string) => {
      dispatch({ type: 'SET_HIGHLIGHT_COLOR', color })
      dispatch({ type: 'SET_TOOL', tool: 'highlight' })
    },
    [dispatch]
  )

  const handleDragStart = (e: React.DragEvent, stickerId: string) => {
    e.dataTransfer.setData('sticker-id', stickerId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchRef.current?.focus()
  }

  if (!state.isStickersOpen) {
    return (
      <button
        onClick={() => dispatch({ type: 'TOGGLE_STICKERS', isOpen: true })}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-card border border-border border-r-0 rounded-l-lg px-1.5 py-4 shadow-md flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open sticker tray"
      >
        <Sparkles className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="w-[268px] border-l border-border bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border flex items-center justify-between">
        <div className="flex gap-1">
          {(['stickers', 'washi', 'highlights'] as PanelTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-2 py-1 rounded text-xs font-mono capitalize transition-colors',
                activeTab === tab
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {tab === 'stickers' ? 'Stickers' : tab === 'washi' ? 'Washi' : 'Highlight'}
            </button>
          ))}
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_STICKERS', isOpen: false })}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tray"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* STICKERS TAB */}
      {activeTab === 'stickers' && (
        <>
          {/* Search */}
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stickers..."
                className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:text-muted-foreground/60 min-w-0"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Pack switcher — only shown when not searching */}
          {!searchQuery && (
            <div className="px-3 py-1.5 border-b border-border/50">
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {STICKER_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => dispatch({ type: 'SET_STICKER_PACK', pack: pack.id })}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors shrink-0',
                      state.stickerPack === pack.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {pack.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category filter — only shown when not searching */}
          {!searchQuery && (
            <div className="px-3 py-1.5 border-b border-border/50 flex flex-wrap gap-1">
              {(['all', 'decorative', 'nature', 'symbols', 'frames', 'text-labels'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors',
                    activeCategory === cat
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {cat === 'all' ? <Heart className="w-3 h-3" /> : CATEGORY_ICONS[cat]}
                  <span>{cat === 'all' ? 'All' : cat === 'text-labels' ? 'Labels' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search results header */}
          {searchQuery && (
            <div className="px-3 py-1.5 border-b border-border/50">
              <span className="font-mono text-xs text-muted-foreground">
                {displayedStickers.length} result{displayedStickers.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
            </div>
          )}

          {/* Sticker grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {displayedStickers.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-mono text-xs text-muted-foreground">No stickers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5">
                {displayedStickers.map((sticker) => {
                  const isHovered = hoveredId === sticker.id
                  return (
                    <button
                      key={sticker.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sticker.id)}
                      onClick={() => handleStickerClick(sticker.id)}
                      onMouseEnter={() => setHoveredId(sticker.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      title={sticker.name}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded-lg text-xl bg-secondary/30 border border-transparent transition-all duration-150',
                        isHovered
                          ? 'scale-[1.22] -rotate-[5deg] bg-secondary/60 border-accent/40 z-10 relative shadow-sm'
                          : 'hover:bg-secondary/50'
                      )}
                      style={{ willChange: 'transform' }}
                    >
                      {sticker.emoji}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-border/50">
            <p className="font-mono text-[11px] text-muted-foreground text-center">
              Click to place &nbsp;·&nbsp; drag to position
            </p>
          </div>
        </>
      )}

      {/* WASHI TAB */}
      {activeTab === 'washi' && (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            Pick a colour then draw on the canvas to place tape.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {WASHI_COLORS.map((w) => {
              const isActive = state.activeWashiColor === w.color && state.activeTool === 'washi'
              return (
                <button
                  key={w.id}
                  onClick={() => handleWashiClick(w.color)}
                  title={w.label}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all duration-150',
                    isActive
                      ? 'border-accent bg-secondary/60 scale-[1.05]'
                      : 'border-transparent hover:border-border hover:bg-secondary/30'
                  )}
                >
                  <div className="w-8 h-4 rounded-sm opacity-80" style={{ backgroundColor: w.color }} />
                  <span className="font-mono text-[10px] text-muted-foreground">{w.label}</span>
                </button>
              )
            })}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-auto">
            Hold drag briefly near horizontal to snap straight.
          </p>
        </div>
      )}

      {/* HIGHLIGHTS TAB */}
      {activeTab === 'highlights' && (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            Pick a colour then draw horizontally to highlight.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {HIGHLIGHT_COLORS.map((h) => {
              const isActive = state.activeHighlightColor === h.color && state.activeTool === 'highlight'
              return (
                <button
                  key={h.id}
                  onClick={() => handleHighlightClick(h.color)}
                  title={h.label}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-150',
                    isActive
                      ? 'border-accent bg-secondary/60 scale-[1.05]'
                      : 'border-transparent hover:border-border hover:bg-secondary/30'
                  )}
                >
                  <div
                    className="w-10 h-4 rounded-sm"
                    style={{
                      backgroundColor: h.color,
                      opacity: 0.7,
                      boxShadow: `4px 0 8px 2px ${h.color}88, -4px 0 8px 2px ${h.color}88`,
                    }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{h.label}</span>
                </button>
              )
            })}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-auto">
            Bleed effect applied automatically at endpoints.
          </p>
        </div>
      )}
    </div>
  )
}
