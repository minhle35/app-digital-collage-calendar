'use client'

import { useState } from 'react'
import { useMutation, useStorage } from '@/lib/liveblocks'
import { STICKER_PACKS, searchStickers, generateElementId, type StickerElement, type StickerCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Search, X, Sparkles, Leaf, Tag, Frame, Grid3X3 } from 'lucide-react'

const CATEGORY_ICONS: Record<StickerCategory, React.ReactNode> = {
  decorative: <Sparkles className="w-3 h-3" />,
  frames: <Frame className="w-3 h-3" />,
  'text-labels': <Tag className="w-3 h-3" />,
  nature: <Leaf className="w-3 h-3" />,
  symbols: <Grid3X3 className="w-3 h-3" />,
}

const CANVAS_W = 820
const CANVAS_H = 620

export function EventStickersPanel() {
  const [activeCategory, setActiveCategory] = useState<StickerCategory | 'all'>('all')
  const [activePack, setActivePack] = useState(STICKER_PACKS[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const elements = useStorage((root) => root.elements)

  const addSticker = useMutation(({ storage }, stickerId: string, category: StickerCategory) => {
    const list = storage.get('elements')
    const margin = 0.15
    const size = 72
    const el: StickerElement = {
      id: generateElementId(),
      type: 'sticker',
      x: CANVAS_W * margin + Math.random() * (CANVAS_W * (1 - margin * 2) - size),
      y: CANVAS_H * margin + Math.random() * (CANVAS_H * (1 - margin * 2) - size),
      width: size,
      height: size,
      rotation: (Math.random() - 0.5) * 14,
      zIndex: list.toArray().length,
      locked: false,
      stickerId,
      category,
      isNew: true,
    }
    list.push(el)
  }, [])

  const currentPack = STICKER_PACKS.find((p) => p.id === activePack)!

  const displayed = searchQuery.trim()
    ? searchStickers(STICKER_PACKS, searchQuery)
    : activeCategory === 'all'
      ? currentPack.stickers
      : currentPack.stickers.filter((s) => s.category === activeCategory)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Pack selector */}
      <div className="px-3 pt-3 pb-2 border-b border-border/40">
        <div className="flex gap-1 flex-wrap">
          {STICKER_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => { setActivePack(pack.id); setActiveCategory('all') }}
              className={cn(
                'px-2 py-0.5 rounded-full font-mono text-[10px] transition-all border',
                activePack === pack.id
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-border/40 text-muted-foreground hover:text-foreground'
              )}
            >
              {pack.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-secondary/40 rounded-md px-2.5 py-1.5">
          <Search className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stickers…"
            className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/50 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      {!searchQuery && (
        <div className="px-3 pb-2 flex gap-1 flex-wrap">
          <CategoryBtn active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</CategoryBtn>
          {(Object.keys(CATEGORY_ICONS) as StickerCategory[]).map((cat) => (
            <CategoryBtn key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
              <span className="flex items-center gap-1">{CATEGORY_ICONS[cat]} {cat}</span>
            </CategoryBtn>
          ))}
        </div>
      )}

      {/* Sticker grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="grid grid-cols-4 gap-1.5">
          {displayed.map((sticker) => (
            <button
              key={sticker.id}
              title={sticker.name}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('sticker-id', sticker.id)}
              onClick={() => addSticker(sticker.id, sticker.category)}
              className="aspect-square flex items-center justify-center text-2xl rounded-md hover:bg-secondary/60 transition-colors cursor-grab active:cursor-grabbing"
            >
              {sticker.emoji}
            </button>
          ))}
          {displayed.length === 0 && (
            <p className="col-span-4 text-center font-mono text-xs text-muted-foreground py-6">No stickers found</p>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded-full font-mono text-[10px] border transition-all',
        active ? 'bg-foreground/10 border-foreground/20 text-foreground' : 'border-border/30 text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
