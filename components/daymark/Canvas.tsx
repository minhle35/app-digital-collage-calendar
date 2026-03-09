'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import {
  CANVAS_THEMES,
  STICKER_PACKS,
  PHOTO_FILTERS,
  generateElementId,
  type AnyElement,
  type PhotoElement,
  type StickerElement,
  type TextElement,
  type WashiElement,
  type HighlightElement,
} from '@/lib/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const CANVAS_WIDTH = 820
const CANVAS_HEIGHT = 620
const SNAP_DEGREES = [0, 45, 90, 135, 180, -45, -90, -135]
const SNAP_THRESHOLD = 8 // degrees

// CSS spring animation via keyframes — stiffness 400, damping 15 => ~one overshoot
const SPRING_KEYFRAMES = `
@keyframes spring-pop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  55%  { transform: scale(1.12) rotate(5deg); opacity: 1; }
  75%  { transform: scale(0.96) rotate(-2deg); opacity: 1; }
  90%  { transform: scale(1.04) rotate(1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
`

// Compute safe random placement within 15% inset of canvas
function randomSafePlacement(canvasW: number, canvasH: number, elW: number, elH: number) {
  const margin = 0.15
  const minX = canvasW * margin
  const maxX = canvasW * (1 - margin) - elW
  const minY = canvasH * margin
  const maxY = canvasH * (1 - margin) - elH
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    rotation: (Math.random() - 0.5) * 14, // -7 to +7
  }
}

// Snap rotation to nearest snap angle if within threshold
function snapRotation(rotation: number): number {
  for (const snap of SNAP_DEGREES) {
    if (Math.abs(rotation - snap) <= SNAP_THRESHOLD) return snap
  }
  return rotation
}

export function Canvas() {
  const { state, dispatch } = useDayMark()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [popIds, setPopIds] = useState<Set<string>>(new Set())

  // Washi draw state
  const [washiDraw, setWashiDraw] = useState<{
    startX: number; startY: number; currentX: number; currentY: number
  } | null>(null)

  // Highlight draw state
  const [highlightDraw, setHighlightDraw] = useState<{
    startX: number; startY: number; currentX: number; currentY: number
  } | null>(null)

  // Drag state
  const [dragState, setDragState] = useState<{
    elementId: string
    startX: number; startY: number
    elementStartX: number; elementStartY: number
  } | null>(null)

  // Resize state
  const [resizeState, setResizeState] = useState<{
    elementId: string; corner: string
    startX: number; startY: number
    startWidth: number; startHeight: number
  } | null>(null)

  // Rotation snap visual feedback
  const [snapFlash, setSnapFlash] = useState<string | null>(null)

  const themeConfig = CANVAS_THEMES.find((t) => t.id === state.canvasTheme)!

  // Mark a newly added sticker for spring animation
  useEffect(() => {
    const last = state.elements[state.elements.length - 1]
    if (!last) return
    if (last.type === 'sticker' && (last as StickerElement).isNew) {
      setPopIds((prev) => new Set([...prev, last.id]))
      // Clear isNew flag
      dispatch({ type: 'UPDATE_ELEMENT', id: last.id, updates: { isNew: false } as Partial<StickerElement> })
      // Remove from popIds after animation
      setTimeout(() => {
        setPopIds((prev) => {
          const next = new Set(prev)
          next.delete(last.id)
          return next
        })
      }, 400)
    }
  }, [state.elements, dispatch])

  // Drag move/up
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState) {
        const dx = e.clientX - dragState.startX
        const dy = e.clientY - dragState.startY
        dispatch({
          type: 'UPDATE_ELEMENT',
          id: dragState.elementId,
          updates: { x: dragState.elementStartX + dx, y: dragState.elementStartY + dy },
        })
      }
      if (resizeState) {
        const dx = e.clientX - resizeState.startX
        const dy = e.clientY - resizeState.startY
        let w = resizeState.startWidth
        let h = resizeState.startHeight
        if (resizeState.corner.includes('e')) w = Math.max(40, resizeState.startWidth + dx)
        if (resizeState.corner.includes('w')) w = Math.max(40, resizeState.startWidth - dx)
        if (resizeState.corner.includes('s')) h = Math.max(40, resizeState.startHeight + dy)
        if (resizeState.corner.includes('n')) h = Math.max(40, resizeState.startHeight - dy)
        dispatch({ type: 'UPDATE_ELEMENT', id: resizeState.elementId, updates: { width: w, height: h } })
      }
      if (washiDraw) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        setWashiDraw((prev) => prev ? { ...prev, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null)
      }
      if (highlightDraw) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        setHighlightDraw((prev) => prev ? { ...prev, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null)
      }
    },
    [dragState, resizeState, washiDraw, highlightDraw, dispatch]
  )

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (dragState) {
        dispatch({ type: 'PUSH_HISTORY' })
        setDragState(null)
      }
      if (resizeState) {
        dispatch({ type: 'PUSH_HISTORY' })
        setResizeState(null)
      }
      // Commit washi tape
      if (washiDraw) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const endX = e.clientX - rect.left
          const endY = e.clientY - rect.top
          const dx = endX - washiDraw.startX
          const dy = endY - washiDraw.startY
          const length = Math.sqrt(dx * dx + dy * dy)
          if (length > 20) {
            const dragMs = Date.now() // we don't track start time, use angle rule
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
            // Snap to horizontal if angle within 8° AND strip is wider than tall (short drag = fast)
            const shouldSnap = Math.abs(angleDeg) <= 8 || Math.abs(angleDeg) >= 172
            const finalAngle = shouldSnap ? 0 : angleDeg
            if (shouldSnap) {
              setSnapFlash('washi-snap')
              setTimeout(() => setSnapFlash(null), 200)
            }
            const el: WashiElement = {
              id: generateElementId(),
              type: 'washi',
              x: washiDraw.startX,
              y: washiDraw.startY - 10,
              width: length,
              height: 20,
              rotation: finalAngle,
              zIndex: state.elements.length,
              locked: false,
              color: state.activeWashiColor,
              opacity: 0.72,
              pattern: 'solid',
            }
            dispatch({ type: 'ADD_ELEMENT', element: el })
          }
        }
        setWashiDraw(null)
      }
      // Commit highlight
      if (highlightDraw) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const endX = e.clientX - rect.left
          const dx = endX - highlightDraw.startX
          if (Math.abs(dx) > 20) {
            const x = dx > 0 ? highlightDraw.startX : endX
            const width = Math.abs(dx)
            const el: HighlightElement = {
              id: generateElementId(),
              type: 'highlight',
              x,
              y: highlightDraw.startY - 8,
              width,
              height: 16,
              rotation: 0,
              zIndex: state.elements.length,
              locked: false,
              color: state.activeHighlightColor,
              strokeHeight: 16,
            }
            dispatch({ type: 'ADD_ELEMENT', element: el })
          }
        }
        setHighlightDraw(null)
      }
    },
    [dragState, resizeState, washiDraw, highlightDraw, dispatch, state.elements.length, state.activeWashiColor, state.activeHighlightColor]
  )

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

  // Canvas mousedown for washi/highlight drawing
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (state.activeTool === 'washi') {
        setWashiDraw({ startX: x, startY: y, currentX: x, currentY: y })
        return
      }
      if (state.activeTool === 'highlight') {
        setHighlightDraw({ startX: x, startY: y, currentX: x, currentY: y })
        return
      }
      // Deselect on canvas click
      dispatch({ type: 'SELECT_ELEMENT', id: null })
    },
    [state.activeTool, dispatch]
  )

  // Element drag start
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, element: AnyElement) => {
      if (element.locked || state.activeTool !== 'select') return
      e.stopPropagation()
      if (editingId === element.id) return // don't drag while editing text
      dispatch({ type: 'SELECT_ELEMENT', id: element.id })
      setDragState({
        elementId: element.id,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: element.x,
        elementStartY: element.y,
      })
    },
    [dispatch, state.activeTool, editingId]
  )

  // Double-click to edit text
  const handleElementDoubleClick = useCallback(
    (e: React.MouseEvent, element: AnyElement) => {
      if (element.type === 'text') {
        e.stopPropagation()
        setEditingId(element.id)
        setEditingText((element as TextElement).content)
      }
    },
    []
  )

  const commitTextEdit = useCallback(() => {
    if (editingId) {
      dispatch({
        type: 'UPDATE_ELEMENT',
        id: editingId,
        updates: { content: editingText } as Partial<TextElement>,
      })
      dispatch({ type: 'PUSH_HISTORY' })
      setEditingId(null)
    }
  }, [editingId, editingText, dispatch])

  // Handle drop for photos and stickers from tray
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left - 40
      const y = e.clientY - rect.top - 40

      const stickerId = e.dataTransfer.getData('sticker-id')
      if (stickerId) {
        const sticker = STICKER_PACKS.flatMap((p) => p.stickers).find((s) => s.id === stickerId)
        if (sticker) {
          const el: StickerElement = {
            id: generateElementId(),
            type: 'sticker',
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: 72,
            height: 72,
            rotation: (Math.random() - 0.5) * 14,
            zIndex: state.elements.length,
            locked: false,
            stickerId: sticker.id,
            category: sticker.category,
            isNew: true,
          }
          dispatch({ type: 'ADD_ELEMENT', element: el })
        }
        return
      }

      const files = e.dataTransfer.files
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const aspect = img.width / img.height
            const w = 220
            const el: PhotoElement = {
              id: generateElementId(),
              type: 'photo',
              x: Math.max(0, x),
              y: Math.max(0, y),
              width: w,
              height: w / aspect,
              rotation: (Math.random() - 0.5) * 4,
              zIndex: state.elements.length,
              locked: false,
              src: ev.target?.result as string,
              filter: 'none',
            }
            dispatch({ type: 'ADD_ELEMENT', element: el })
          }
          img.src = ev.target?.result as string
        }
        reader.readAsDataURL(files[0])
      }
    },
    [dispatch, state.elements.length]
  )

  // Render elements
  const renderElement = (element: AnyElement) => {
    const isSelected = state.selectedElementId === element.id
    const isPopping = popIds.has(element.id)
    const filterStyle = element.type === 'photo'
      ? PHOTO_FILTERS.find((f) => f.id === (element as PhotoElement).filter)?.filterStyle ?? ''
      : ''

    if (element.type === 'washi') {
      const w = element as WashiElement
      return (
        <div
          key={element.id}
          className={cn('absolute cursor-move', isSelected && 'ring-2 ring-accent/70')}
          style={{
            left: w.x,
            top: w.y,
            width: w.width,
            height: w.height,
            transform: `rotate(${w.rotation}deg)`,
            transformOrigin: '0 50%',
            zIndex: w.zIndex,
            backgroundColor: w.color,
            opacity: w.opacity,
            borderRadius: 2,
          }}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        />
      )
    }

    if (element.type === 'highlight') {
      const h = element as HighlightElement
      return (
        <div
          key={element.id}
          className={cn('absolute cursor-move pointer-events-auto', isSelected && 'ring-1 ring-accent/70')}
          style={{
            left: h.x,
            top: h.y,
            width: h.width,
            height: h.height,
            zIndex: h.zIndex,
            backgroundColor: h.color,
            opacity: 0.55,
            borderRadius: 2,
            // Bleed effect at endpoints via box shadow
            boxShadow: `8px 0 12px 4px ${h.color}88, -8px 0 12px 4px ${h.color}88`,
          }}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        />
      )
    }

    return (
      <div
        key={element.id}
        className={cn(
          'absolute cursor-move transition-shadow duration-100',
          isSelected && 'ring-2 ring-accent shadow-[0_0_0_2px_var(--accent),0_0_12px_2px_color-mix(in_oklch,var(--accent)_40%,transparent)]',
          element.locked && 'cursor-not-allowed opacity-70'
        )}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.type === 'sticker' ? element.width : element.height, // stickers are square
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex,
          animation: isPopping ? 'spring-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
        }}
        onMouseDown={(e) => handleElementMouseDown(e, element)}
        onDoubleClick={(e) => handleElementDoubleClick(e, element)}
      >
        {element.type === 'photo' && (
          <img
            src={(element as PhotoElement).src}
            alt="User photo"
            className="w-full h-full object-cover rounded-sm"
            style={{ filter: filterStyle }}
            draggable={false}
          />
        )}

        {element.type === 'sticker' && (
          <div className="w-full h-full flex items-center justify-center select-none text-5xl">
            {STICKER_PACKS.flatMap((p) => p.stickers).find((s) => s.id === (element as StickerElement).stickerId)?.emoji}
          </div>
        )}

        {element.type === 'text' && (
          editingId === element.id ? (
            <textarea
              autoFocus
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={commitTextEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setEditingId(null); return }
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit() }
              }}
              className="w-full h-full resize-none bg-transparent outline-none border-none"
              style={{
                fontFamily: (element as TextElement).fontFamily,
                fontSize: (element as TextElement).fontSize,
                fontWeight: (element as TextElement).fontWeight,
                color: (element as TextElement).color,
                textAlign: (element as TextElement).textAlign,
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center break-words leading-snug"
              style={{
                fontFamily: (element as TextElement).fontFamily,
                fontSize: (element as TextElement).fontSize,
                fontWeight: (element as TextElement).fontWeight,
                color: (element as TextElement).color,
                textAlign: (element as TextElement).textAlign,
              }}
            >
              {(element as TextElement).content}
            </div>
          )
        )}

        {/* Resize handles */}
        {isSelected && !element.locked && element.type !== 'washi' && element.type !== 'highlight' && (
          <>
            {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
              <div
                key={corner}
                className={cn(
                  'absolute w-3 h-3 bg-accent rounded-full border-2 border-background',
                  corner === 'nw' && '-top-1.5 -left-1.5 cursor-nw-resize',
                  corner === 'ne' && '-top-1.5 -right-1.5 cursor-ne-resize',
                  corner === 'sw' && '-bottom-1.5 -left-1.5 cursor-sw-resize',
                  corner === 'se' && '-bottom-1.5 -right-1.5 cursor-se-resize'
                )}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  setResizeState({
                    elementId: element.id,
                    corner,
                    startX: e.clientX,
                    startY: e.clientY,
                    startWidth: element.width,
                    startHeight: element.height,
                  })
                }}
              />
            ))}
          </>
        )}
      </div>
    )
  }

  // Washi preview line during draw
  const washiPreview = washiDraw ? (() => {
    const dx = washiDraw.currentX - washiDraw.startX
    const dy = washiDraw.currentY - washiDraw.startY
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    return (
      <div
        className="absolute pointer-events-none opacity-60"
        style={{
          left: washiDraw.startX,
          top: washiDraw.startY - 10,
          width: length,
          height: 20,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          backgroundColor: state.activeWashiColor,
          borderRadius: 2,
          border: '1px dashed rgba(0,0,0,0.2)',
          zIndex: 9999,
        }}
      />
    )
  })() : null

  // Highlight preview
  const highlightPreview = highlightDraw ? (() => {
    const dx = highlightDraw.currentX - highlightDraw.startX
    const x = dx > 0 ? highlightDraw.startX : highlightDraw.currentX
    const width = Math.abs(dx)
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: x,
          top: highlightDraw.startY - 8,
          width,
          height: 16,
          backgroundColor: state.activeHighlightColor,
          opacity: 0.45,
          zIndex: 9999,
          boxShadow: `8px 0 12px 4px ${state.activeHighlightColor}88, -8px 0 12px 4px ${state.activeHighlightColor}88`,
        }}
      />
    )
  })() : null

  const hasElements = state.elements.length > 0

  return (
    <>
      {/* Inject spring keyframes once */}
      <style>{SPRING_KEYFRAMES}</style>

      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto"
        style={{
          cursor:
            state.activeTool === 'washi'
              ? 'crosshair'
              : state.activeTool === 'highlight'
                ? 'text'
                : 'default',
        }}
      >
        <div
          ref={canvasRef}
          id="daymark-canvas"
          className={cn(
            'relative grain rounded-lg shadow-xl border border-border/60 overflow-hidden select-none',
            themeConfig.bgClass,
            themeConfig.textClass
          )}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onMouseDown={handleCanvasMouseDown}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Ruled lines texture — very faint */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 27px,
                ${themeConfig.isDark ? '#ffffff' : '#1a1a1a'} 28px
              )`,
            }}
          />

          {/* Date watermark — bottom right, almost invisible */}
          {state.selectedDate && (
            <div className={cn(
              'absolute bottom-4 right-5 pointer-events-none z-10',
              themeConfig.isDark ? 'text-white/25' : 'text-foreground/20'
            )}>
              <p className="font-serif italic text-xs tracking-wide text-right">
                {format(state.selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Canvas prompt — centered, fades away when elements exist */}
          {!hasElements && (
            <div className={cn(
              'absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500',
              themeConfig.isDark ? 'text-white/40' : 'text-foreground/35'
            )}>
              <span className="font-serif italic text-lg mb-1">✦</span>
              <p className="font-serif italic text-base text-center leading-relaxed px-8">
                {state.mode === 'milestone' && state.milestone
                  ? `Week ${Math.ceil((Date.now() - state.milestone.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))} of your journey — what do you want to remember about today?`
                  : 'What are you studying today?'}
              </p>
              <p className={cn(
                'font-mono text-xs mt-3',
                themeConfig.isDark ? 'text-white/25' : 'text-foreground/25'
              )}>
                Start writing, or drop a sticker to begin.
              </p>
            </div>
          )}

          {/* Snap flash overlay — brief guide line */}
          {snapFlash === 'washi-snap' && (
            <div className="absolute inset-x-0 pointer-events-none z-[9998] flex items-center" style={{ top: '50%' }}>
              <div className="w-full h-px border-t border-dashed border-accent/50 transition-opacity animate-in fade-in fade-out duration-150" />
            </div>
          )}

          {/* All canvas elements */}
          {[...state.elements].sort((a, b) => a.zIndex - b.zIndex).map(renderElement)}

          {/* Draw previews */}
          {washiPreview}
          {highlightPreview}
        </div>
      </div>
    </>
  )
}
