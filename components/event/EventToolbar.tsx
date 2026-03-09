'use client'

import { useCallback } from 'react'
import { useMutation, useStorage } from '@/lib/liveblocks'
import { generateElementId, type TextElement, type AnyElement } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  MousePointer2, Type, Pen, Highlighter, Image, Trash2,
  Lock, Unlock, ChevronUp, ChevronDown,
} from 'lucide-react'

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'washi', icon: Pen, label: 'Washi tape', shortcut: 'W' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight', shortcut: 'H' },
]

interface EventToolbarProps {
  activeTool: string
  onToolChange: (tool: string) => void
  selectedElementId: string | null
  onDeselect: () => void
  activeWashiColor: string
  activeHighlightColor: string
}

export function EventToolbar({ activeTool, onToolChange, selectedElementId, onDeselect }: EventToolbarProps) {
  const elements = useStorage((root) => root.elements)

  const addText = useMutation(({ storage }) => {
    const list = storage.get('elements')
    const el: TextElement = {
      id: generateElementId(), type: 'text',
      x: 80 + Math.random() * 400, y: 80 + Math.random() * 300,
      width: 200, height: 60, rotation: 0,
      zIndex: list.toArray().length, locked: false,
      content: 'Type something…',
      fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400,
      color: '#1a1a1a', textAlign: 'left',
    }
    list.push(el)
  }, [])

  const addPhoto = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      // handled by drop handler in canvas; just re-use FileReader approach via drag event won't work here
      // So we emit a custom event the canvas listens to
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        const img = new window.Image()
        img.onload = () => {
          const w = 220
          const event = new CustomEvent('toolbar-add-photo', {
            detail: { src, width: w, height: w / (img.width / img.height) }
          })
          document.dispatchEvent(event)
        }
        img.src = src
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [])

  const deleteSelected = useMutation(({ storage }) => {
    if (!selectedElementId) return
    const list = storage.get('elements')
    const idx = list.findIndex((el) => el.id === selectedElementId)
    if (idx !== -1) { list.delete(idx); onDeselect() }
  }, [selectedElementId, onDeselect])

  const toggleLock = useMutation(({ storage }) => {
    if (!selectedElementId) return
    const list = storage.get('elements')
    const idx = list.findIndex((el) => el.id === selectedElementId)
    if (idx === -1) return
    const el = list.get(idx)
    list.set(idx, { ...el, locked: !el.locked } as AnyElement)
  }, [selectedElementId])

  const moveLayer = useMutation(({ storage }, dir: 'up' | 'down') => {
    if (!selectedElementId) return
    const list = storage.get('elements')
    const arr = list.toArray()
    const idx = arr.findIndex((el) => el.id === selectedElementId)
    if (idx === -1) return
    const el = arr[idx]
    const currentZ = el.zIndex
    const delta = dir === 'up' ? 1 : -1
    list.set(idx, { ...el, zIndex: currentZ + delta } as AnyElement)
  }, [selectedElementId])

  const selectedEl = selectedElementId
    ? ((elements as AnyElement[]) ?? []).find((el) => el.id === selectedElementId)
    : null

  return (
    <div className="w-12 border-r border-border bg-card flex flex-col items-center py-3 gap-1 shrink-0">
      {/* Drawing tools */}
      {TOOLS.map((tool) => (
        <ToolBtn
          key={tool.id}
          active={activeTool === tool.id}
          onClick={() => {
            if (tool.id === 'text') { addText(); onToolChange('select') }
            else onToolChange(tool.id)
          }}
          title={`${tool.label} (${tool.shortcut})`}
        >
          <tool.icon className="w-4 h-4" />
        </ToolBtn>
      ))}

      <ToolBtn onClick={addPhoto} title="Add photo">
        <Image className="w-4 h-4" />
      </ToolBtn>

      {/* Contextual — element selected */}
      {selectedEl && (
        <>
          <div className="w-6 border-t border-border my-1" />
          <ToolBtn onClick={toggleLock} title={selectedEl.locked ? 'Unlock' : 'Lock'}>
            {selectedEl.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </ToolBtn>
          <ToolBtn onClick={() => moveLayer('up')} title="Move up">
            <ChevronUp className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn onClick={() => moveLayer('down')} title="Move down">
            <ChevronDown className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn onClick={deleteSelected} title="Delete" danger>
            <Trash2 className="w-4 h-4" />
          </ToolBtn>
        </>
      )}
    </div>
  )
}

function ToolBtn({ children, active, onClick, title, danger }: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-md transition-all duration-150',
        active
          ? 'bg-accent text-accent-foreground'
          : danger
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
