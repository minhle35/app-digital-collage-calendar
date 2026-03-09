'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import { generateElementId, WASHI_COLORS, HIGHLIGHT_COLORS, type PhotoElement, type TextElement, type ToolMode } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  MousePointer2, ImagePlus, Type, Trash2, Layers,
  ChevronUp, ChevronDown, ChevronsUp, ChevronsDown,
  Lock, Unlock, Download, RotateCcw, Palette,
  Undo2, Redo2, Camera, Scissors, Highlighter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ToolbarProps {
  onExport: () => void
  onOpenThemes: () => void
  onOpenPhotobooth: () => void
}

function TBtn({
  icon, label, onClick, active = false, danger = false, disabled = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'toolbar-btn',
              active && 'toolbar-btn-active',
              danger && 'text-destructive hover:bg-destructive/10',
              disabled && 'opacity-35 cursor-not-allowed'
            )}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-mono text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function Toolbar({ onExport, onOpenThemes, onOpenPhotobooth }: ToolbarProps) {
  const { state, dispatch } = useDayMark()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedElement = state.elements.find((el) => el.id === state.selectedElementId)
  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey
      if (!isMeta) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) dispatch({ type: 'UNDO' })
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        if (canRedo) dispatch({ type: 'REDO' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canUndo, canRedo, dispatch])

  // Also handle Delete/Backspace to remove selected element
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        dispatch({ type: 'DELETE_ELEMENT', id: state.selectedElementId })
      }
      if (e.key === 'Escape' && state.selectedElementId) {
        dispatch({ type: 'SELECT_ELEMENT', id: null })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.selectedElementId, dispatch])

  const handleToolChange = useCallback(
    (tool: ToolMode) => {
      dispatch({ type: 'SET_TOOL', tool })
      if (tool === 'sticker') dispatch({ type: 'TOGGLE_STICKERS', isOpen: true })
    },
    [dispatch]
  )

  const handleAddPhoto = useCallback(() => { fileInputRef.current?.click() }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
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
            x: 280,
            y: 180,
            width: w,
            height: w / aspect,
            rotation: (Math.random() - 0.5) * 4,
            zIndex: state.elements.length,
            locked: false,
            src: ev.target?.result as string,
            filter: 'none',
          }
          dispatch({ type: 'ADD_ELEMENT', element: el })
          dispatch({ type: 'SET_TOOL', tool: 'select' })
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [dispatch, state.elements.length]
  )

  const handleAddText = useCallback(() => {
    const el: TextElement = {
      id: generateElementId(),
      type: 'text',
      x: 240 + Math.random() * 80,
      y: 200 + Math.random() * 60,
      width: 200,
      height: 60,
      rotation: 0,
      zIndex: state.elements.length,
      locked: false,
      content: 'Double-click to edit',
      fontFamily: 'var(--font-serif)',
      fontSize: 22,
      fontWeight: 400,
      color: 'currentColor',
      textAlign: 'center',
    }
    dispatch({ type: 'ADD_ELEMENT', element: el })
    dispatch({ type: 'SET_TOOL', tool: 'select' })
  }, [dispatch, state.elements.length])

  const handleDelete = useCallback(() => {
    if (state.selectedElementId) dispatch({ type: 'DELETE_ELEMENT', id: state.selectedElementId })
  }, [dispatch, state.selectedElementId])

  const handleToggleLock = useCallback(() => {
    if (selectedElement) {
      dispatch({ type: 'UPDATE_ELEMENT', id: selectedElement.id, updates: { locked: !selectedElement.locked } })
    }
  }, [dispatch, selectedElement])

  const handleReorder = useCallback(
    (direction: 'up' | 'down' | 'top' | 'bottom') => {
      if (state.selectedElementId) dispatch({ type: 'REORDER_ELEMENT', id: state.selectedElementId, direction })
    },
    [dispatch, state.selectedElementId]
  )

  const handleReset = useCallback(() => {
    if (window.confirm('Reset canvas? All elements will be removed.')) {
      dispatch({ type: 'RESET' })
    }
  }, [dispatch])

  return (
    <div className="h-12 border-b border-border bg-card px-3 flex items-center justify-between gap-2 shrink-0">
      {/* Left: primary tools */}
      <div className="flex items-center gap-0.5">
        <TBtn
          icon={<MousePointer2 className="w-4 h-4" />}
          label="Select (V)"
          onClick={() => handleToolChange('select')}
          active={state.activeTool === 'select'}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <TBtn
          icon={<ImagePlus className="w-4 h-4" />}
          label="Add Photo"
          onClick={handleAddPhoto}
        />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <TBtn
          icon={<Camera className="w-4 h-4" />}
          label="Photobooth"
          onClick={onOpenPhotobooth}
        />

        <TBtn
          icon={<Type className="w-4 h-4" />}
          label="Add Text"
          onClick={handleAddText}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <TBtn
          icon={<Scissors className="w-4 h-4" />}
          label="Washi Tape"
          onClick={() => handleToolChange('washi')}
          active={state.activeTool === 'washi'}
        />

        <TBtn
          icon={<Highlighter className="w-4 h-4" />}
          label="Highlight"
          onClick={() => handleToolChange('highlight')}
          active={state.activeTool === 'highlight'}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <TBtn
          icon={<Palette className="w-4 h-4" />}
          label="Themes"
          onClick={onOpenThemes}
        />
      </div>

      {/* Center: selection-dependent actions */}
      <div className="flex items-center gap-0.5 flex-1 justify-center">
        {selectedElement && (
          <>
            <TBtn
              icon={selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              label={selectedElement.locked ? 'Unlock' : 'Lock'}
              onClick={handleToggleLock}
            />

            <DropdownMenu>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="toolbar-btn">
                        <Layers className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-mono text-xs">Layer</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="center" className="font-mono text-xs">
                <DropdownMenuItem onClick={() => handleReorder('top')}>
                  <ChevronsUp className="w-4 h-4 mr-2" /> Bring to Front
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReorder('up')}>
                  <ChevronUp className="w-4 h-4 mr-2" /> Bring Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReorder('down')}>
                  <ChevronDown className="w-4 h-4 mr-2" /> Send Backward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReorder('bottom')}>
                  <ChevronsDown className="w-4 h-4 mr-2" /> Send to Back
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TBtn
              icon={<Trash2 className="w-4 h-4" />}
              label="Delete (Del)"
              onClick={handleDelete}
              danger
            />
          </>
        )}
      </div>

      {/* Right: undo/redo + export */}
      <div className="flex items-center gap-1">
        <TBtn
          icon={<Undo2 className="w-4 h-4" />}
          label="Undo (Cmd+Z)"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
        />
        <TBtn
          icon={<Redo2 className="w-4 h-4" />}
          label="Redo (Cmd+Shift+Z)"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <TBtn
          icon={<RotateCcw className="w-4 h-4" />}
          label="Reset Canvas"
          onClick={handleReset}
        />

        <Button onClick={onExport} size="sm" className="gap-1.5 font-mono text-xs h-8 ml-1">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>
    </div>
  )
}
