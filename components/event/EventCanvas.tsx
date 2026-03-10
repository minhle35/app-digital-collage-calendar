'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useStorage, useMutation, useUpdateMyPresence } from '@/lib/liveblocks'
import {
  CANVAS_THEMES, STICKER_PACKS, PHOTO_FILTERS,
  generateElementId,
  type AnyElement, type PhotoElement, type StickerElement,
  type TextElement, type WashiElement, type HighlightElement,
  type CanvasTheme,
} from '@/lib/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { PHOTO_LIBRARY_LIMIT } from '@/lib/event-types'

const CANVAS_WIDTH = 820
const CANVAS_HEIGHT = 620

const SPRING_KEYFRAMES = `
@keyframes spring-pop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  55%  { transform: scale(1.12) rotate(5deg); opacity: 1; }
  75%  { transform: scale(0.96) rotate(-2deg); opacity: 1; }
  90%  { transform: scale(1.04) rotate(1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
`

interface EventCanvasProps {
  activeTool: string
  activeWashiColor: string
  activeHighlightColor: string
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  canvasTheme: CanvasTheme
  date: string
}

export function EventCanvas({
  activeTool, activeWashiColor, activeHighlightColor,
  selectedElementId, onSelectElement, canvasTheme, date,
}: EventCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elements = useStorage((root) => root.elements)
  const updateMyPresence = useUpdateMyPresence()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [popIds, setPopIds] = useState<Set<string>>(new Set())
  const [washiDraw, setWashiDraw] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)
  const [highlightDraw, setHighlightDraw] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)
  const [dragState, setDragState] = useState<{ elementId: string; startX: number; startY: number; elementStartX: number; elementStartY: number } | null>(null)
  const [resizeState, setResizeState] = useState<{ elementId: string; corner: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)
  const [snapFlash, setSnapFlash] = useState(false)

  const themeConfig = CANVAS_THEMES.find((t) => t.id === canvasTheme)!

  // Liveblocks mutations
  const addElement = useMutation(({ storage }, element: AnyElement) => {
    storage.get('elements').push(element)
  }, [])

  const updateElement = useMutation(({ storage }, id: string, updates: Partial<AnyElement>) => {
    const list = storage.get('elements')
    const idx = list.findIndex((el) => el.id === id)
    if (idx === -1) return
    const el = list.get(idx)
    list.set(idx, { ...el, ...updates } as AnyElement)
  }, [])

  const deleteElement = useMutation(({ storage }, id: string) => {
    const list = storage.get('elements')
    const idx = list.findIndex((el) => el.id === id)
    if (idx !== -1) list.delete(idx)
  }, [])

  const addPhotoElement = useMutation(({ storage }, id: string, src: string, x: number, y: number, w: number, h: number) => {
    const photos = storage.get('photos')
    if (photos.toArray().length >= PHOTO_LIBRARY_LIMIT) return
    const list = storage.get('elements')
    const el: PhotoElement = {
      id, type: 'photo',
      x, y, width: w, height: h,
      rotation: (Math.random() - 0.5) * 4,
      zIndex: list.toArray().length,
      locked: false, src, filter: 'none',
    }
    list.push(el)
    const exists = photos.toArray().some((s) => { try { return JSON.parse(s).id === id } catch { return false } })
    if (!exists) photos.push(JSON.stringify({ id, src, addedAt: Date.now() }))
  }, [])

  // Spring pop for newly added stickers
  const prevLengthRef = useRef(0)
  useEffect(() => {
    if (!elements) return
    const arr = elements as AnyElement[]
    if (arr.length > prevLengthRef.current) {
      const last = arr[arr.length - 1]
      if (last?.type === 'sticker') {
        setPopIds((prev) => new Set([...prev, last.id]))
        setTimeout(() => setPopIds((prev) => { const n = new Set(prev); n.delete(last.id); return n }), 400)
      }
    }
    prevLengthRef.current = arr.length
  }, [elements])

  // Mouse move/up for drag, resize, washi, highlight
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()

    // Update cursor presence
    if (rect) {
      updateMyPresence({ cursor: { x: e.clientX - rect.left, y: e.clientY - rect.top } })
    }

    if (dragState) {
      updateElement(dragState.elementId, {
        x: dragState.elementStartX + (e.clientX - dragState.startX),
        y: dragState.elementStartY + (e.clientY - dragState.startY),
      })
    }
    if (resizeState) {
      const dx = e.clientX - resizeState.startX
      const dy = e.clientY - resizeState.startY
      let w = resizeState.startWidth, h = resizeState.startHeight
      if (resizeState.corner.includes('e')) w = Math.max(40, resizeState.startWidth + dx)
      if (resizeState.corner.includes('w')) w = Math.max(40, resizeState.startWidth - dx)
      if (resizeState.corner.includes('s')) h = Math.max(40, resizeState.startHeight + dy)
      if (resizeState.corner.includes('n')) h = Math.max(40, resizeState.startHeight - dy)
      updateElement(resizeState.elementId, { width: w, height: h })
    }
    if (washiDraw && rect) {
      setWashiDraw((p) => p ? { ...p, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null)
    }
    if (highlightDraw && rect) {
      setHighlightDraw((p) => p ? { ...p, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null)
    }
  }, [dragState, resizeState, washiDraw, highlightDraw, updateElement, updateMyPresence])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setDragState(null)
    setResizeState(null)

    if (washiDraw) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const endX = e.clientX - rect.left
        const endY = e.clientY - rect.top
        const dx = endX - washiDraw.startX
        const dy = endY - washiDraw.startY
        const length = Math.sqrt(dx * dx + dy * dy)
        if (length > 20) {
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
          const shouldSnap = Math.abs(angleDeg) <= 8 || Math.abs(angleDeg) >= 172
          if (shouldSnap) { setSnapFlash(true); setTimeout(() => setSnapFlash(false), 200) }
          addElement({
            id: generateElementId(), type: 'washi',
            x: washiDraw.startX, y: washiDraw.startY - 10,
            width: length, height: 20,
            rotation: shouldSnap ? 0 : angleDeg,
            zIndex: (elements?.length ?? 0),
            locked: false, color: activeWashiColor, opacity: 0.72, pattern: 'solid',
          } as WashiElement)
        }
      }
      setWashiDraw(null)
    }

    if (highlightDraw) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const endX = e.clientX - rect.left
        const dx = endX - highlightDraw.startX
        if (Math.abs(dx) > 20) {
          const x = dx > 0 ? highlightDraw.startX : endX
          addElement({
            id: generateElementId(), type: 'highlight',
            x, y: highlightDraw.startY - 8,
            width: Math.abs(dx), height: 16, rotation: 0,
            zIndex: (elements?.length ?? 0),
            locked: false, color: activeHighlightColor, strokeHeight: 16,
          } as HighlightElement)
        }
      }
      setHighlightDraw(null)
    }
  }, [dragState, resizeState, washiDraw, highlightDraw, addElement, elements, activeWashiColor, activeHighlightColor])

  useEffect(() => {
    if (dragState || resizeState || washiDraw || highlightDraw) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, resizeState, washiDraw, highlightDraw, handleMouseMove, handleMouseUp])

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (activeTool === 'washi') { setWashiDraw({ startX: x, startY: y, currentX: x, currentY: y }); return }
    if (activeTool === 'highlight') { setHighlightDraw({ startX: x, startY: y, currentX: x, currentY: y }); return }
    onSelectElement(null)
  }, [activeTool, onSelectElement])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, el: AnyElement) => {
    if (el.locked || activeTool !== 'select') return
    e.stopPropagation()
    if (editingId === el.id) return
    onSelectElement(el.id)
    setDragState({ elementId: el.id, startX: e.clientX, startY: e.clientY, elementStartX: el.x, elementStartY: el.y })
  }, [activeTool, editingId, onSelectElement])

  const handleElementDoubleClick = useCallback((e: React.MouseEvent, el: AnyElement) => {
    if (el.type === 'text') { e.stopPropagation(); setEditingId(el.id); setEditingText((el as TextElement).content) }
  }, [])

  const commitTextEdit = useCallback(() => {
    if (editingId) { updateElement(editingId, { content: editingText } as Partial<TextElement>); setEditingId(null) }
  }, [editingId, editingText, updateElement])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left - 40
    const y = e.clientY - rect.top - 40

    const stickerId = e.dataTransfer.getData('sticker-id')
    if (stickerId) {
      const sticker = STICKER_PACKS.flatMap((p) => p.stickers).find((s) => s.id === stickerId)
      if (sticker) addElement({
        id: generateElementId(), type: 'sticker',
        x: Math.max(0, x), y: Math.max(0, y), width: 72, height: 72,
        rotation: (Math.random() - 0.5) * 14, zIndex: elements?.length ?? 0, locked: false,
        stickerId: sticker.id, category: sticker.category, isNew: true,
      } as StickerElement)
      return
    }

    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new window.Image()
        img.onload = () => {
          const w = 220
          const id = generateElementId()
          const src = ev.target?.result as string
          addPhotoElement(id, src, Math.max(0, x), Math.max(0, y), w, w / (img.width / img.height))
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(files[0])
    }
  }, [addElement, addPhotoElement, elements])

  const renderElement = (el: AnyElement) => {
    const isSelected = selectedElementId === el.id
    const isPopping = popIds.has(el.id)
    const filterStyle = el.type === 'photo'
      ? PHOTO_FILTERS.find((f) => f.id === (el as PhotoElement).filter)?.filterStyle ?? '' : ''

    if (el.type === 'washi') {
      const w = el as WashiElement
      return (
        <div key={el.id}
          className={cn('absolute cursor-move', isSelected && 'ring-2 ring-accent/70')}
          style={{ left: w.x, top: w.y, width: w.width, height: w.height, transform: `rotate(${w.rotation}deg)`, transformOrigin: '0 50%', zIndex: w.zIndex, backgroundColor: w.color, opacity: w.opacity, borderRadius: 2 }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
        />
      )
    }

    if (el.type === 'highlight') {
      const h = el as HighlightElement
      return (
        <div key={el.id}
          className={cn('absolute cursor-move', isSelected && 'ring-1 ring-accent/70')}
          style={{ left: h.x, top: h.y, width: h.width, height: h.height, zIndex: h.zIndex, backgroundColor: h.color, opacity: 0.55, borderRadius: 2, boxShadow: `8px 0 12px 4px ${h.color}88, -8px 0 12px 4px ${h.color}88` }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
        />
      )
    }

    return (
      <div key={el.id}
        className={cn('absolute cursor-move transition-shadow duration-100',
          isSelected && 'ring-2 ring-accent shadow-[0_0_0_2px_var(--accent),0_0_12px_2px_color-mix(in_oklch,var(--accent)_40%,transparent)]',
          el.locked && 'cursor-not-allowed opacity-70')}
        style={{ left: el.x, top: el.y, width: el.width, height: el.type === 'sticker' ? el.width : el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex, animation: isPopping ? 'spring-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : undefined }}
        onMouseDown={(e) => handleElementMouseDown(e, el)}
        onDoubleClick={(e) => handleElementDoubleClick(e, el)}
      >
        {el.type === 'photo' && <img src={(el as PhotoElement).src} alt="" className="w-full h-full object-cover rounded-sm" style={{ filter: filterStyle }} draggable={false} />}
        {el.type === 'sticker' && (
          <div className="w-full h-full flex items-center justify-center select-none text-5xl">
            {STICKER_PACKS.flatMap((p) => p.stickers).find((s) => s.id === (el as StickerElement).stickerId)?.emoji}
          </div>
        )}
        {el.type === 'text' && (
          editingId === el.id
            ? <textarea autoFocus value={editingText} onChange={(e) => setEditingText(e.target.value)} onBlur={commitTextEdit} onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit() } }} className="w-full h-full resize-none bg-transparent outline-none border-none" style={{ fontFamily: (el as TextElement).fontFamily, fontSize: (el as TextElement).fontSize, fontWeight: (el as TextElement).fontWeight, color: (el as TextElement).color, textAlign: (el as TextElement).textAlign }} />
            : <div className="w-full h-full flex items-center justify-center break-words leading-snug" style={{ fontFamily: (el as TextElement).fontFamily, fontSize: (el as TextElement).fontSize, fontWeight: (el as TextElement).fontWeight, color: (el as TextElement).color, textAlign: (el as TextElement).textAlign }}>{(el as TextElement).content}</div>
        )}
        {isSelected && !el.locked && (
          (['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <div key={corner}
              className={cn('absolute w-3 h-3 bg-accent rounded-full border-2 border-background',
                corner === 'nw' && '-top-1.5 -left-1.5 cursor-nw-resize',
                corner === 'ne' && '-top-1.5 -right-1.5 cursor-ne-resize',
                corner === 'sw' && '-bottom-1.5 -left-1.5 cursor-sw-resize',
                corner === 'se' && '-bottom-1.5 -right-1.5 cursor-se-resize')}
              onMouseDown={(e) => { e.stopPropagation(); setResizeState({ elementId: el.id, corner, startX: e.clientX, startY: e.clientY, startWidth: el.width, startHeight: el.height }) }}
            />
          ))
        )}
      </div>
    )
  }

  const elementsArr = (elements ?? []) as AnyElement[]
  const parsedDate = date ? new Date(date + 'T00:00:00') : null

  return (
    <>
      <style>{SPRING_KEYFRAMES}</style>
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto"
        style={{ cursor: activeTool === 'washi' ? 'crosshair' : activeTool === 'highlight' ? 'text' : 'default' }}
      >
        <div
          ref={canvasRef}
          id="event-canvas"
          className={cn('relative grain rounded-lg shadow-xl border border-border/60 overflow-hidden select-none', themeConfig.bgClass, themeConfig.textClass)}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onMouseDown={handleCanvasMouseDown}
          onMouseLeave={handleMouseLeave}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Ruled lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${themeConfig.isDark ? '#ffffff' : '#1a1a1a'} 28px)` }} />

          {/* Date watermark */}
          {parsedDate && (
            <div className={cn('absolute bottom-4 right-5 pointer-events-none z-10', themeConfig.isDark ? 'text-white/25' : 'text-foreground/20')}>
              <p className="font-serif italic text-xs tracking-wide">{format(parsedDate, 'MMMM d, yyyy')}</p>
            </div>
          )}

          {/* Empty state */}
          {elementsArr.length === 0 && (
            <div className={cn('absolute inset-0 flex flex-col items-center justify-center pointer-events-none', themeConfig.isDark ? 'text-white/40' : 'text-foreground/35')}>
              <span className="font-serif italic text-lg mb-1">✦</span>
              <p className="font-serif italic text-base text-center px-8">What do you want to remember about this moment?</p>
              <p className={cn('font-mono text-xs mt-3', themeConfig.isDark ? 'text-white/25' : 'text-foreground/25')}>Drop a sticker, write something, or take a photo together.</p>
            </div>
          )}

          {/* Snap flash */}
          {snapFlash && <div className="absolute inset-x-0 pointer-events-none z-[9998] flex items-center" style={{ top: '50%' }}><div className="w-full h-px border-t border-dashed border-accent/50" /></div>}

          {/* Washi preview */}
          {washiDraw && (() => {
            const dx = washiDraw.currentX - washiDraw.startX
            const dy = washiDraw.currentY - washiDraw.startY
            return (
              <div className="absolute pointer-events-none opacity-60"
                style={{ left: washiDraw.startX, top: washiDraw.startY - 10, width: Math.sqrt(dx * dx + dy * dy), height: 20, transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`, transformOrigin: '0 50%', backgroundColor: activeWashiColor, borderRadius: 2, border: '1px dashed rgba(0,0,0,0.2)', zIndex: 9999 }} />
            )
          })()}

          {/* Highlight preview */}
          {highlightDraw && (() => {
            const dx = highlightDraw.currentX - highlightDraw.startX
            return (
              <div className="absolute pointer-events-none"
                style={{ left: dx > 0 ? highlightDraw.startX : highlightDraw.currentX, top: highlightDraw.startY - 8, width: Math.abs(dx), height: 16, backgroundColor: activeHighlightColor, opacity: 0.45, zIndex: 9999, boxShadow: `8px 0 12px 4px ${activeHighlightColor}88, -8px 0 12px 4px ${activeHighlightColor}88` }} />
            )
          })()}

          {[...elementsArr].sort((a, b) => a.zIndex - b.zIndex).map(renderElement)}
        </div>
      </div>
    </>
  )
}
