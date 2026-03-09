'use client'

import { useDayMark } from '@/lib/DayMarkContext'
import { PHOTO_FILTERS, type PhotoElement, type TextElement, type WashiElement, type HighlightElement, type PhotoFilter } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RotateCw, Lock, Unlock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PropertiesPanel() {
  const { state, dispatch } = useDayMark()

  const selectedElement = state.elements.find((el) => el.id === state.selectedElementId)

  if (!selectedElement) {
    return (
      <div className="w-64 border-l border-border bg-card p-4">
        <p className="font-mono text-xs text-muted-foreground text-center">
          Select an element to edit its properties
        </p>
      </div>
    )
  }

  const handleRotationChange = (value: number[]) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: selectedElement.id,
      updates: { rotation: value[0] },
    })
  }

  const handleToggleLock = () => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: selectedElement.id,
      updates: { locked: !selectedElement.locked },
    })
  }

  const handleFilterChange = (filter: PhotoFilter) => {
    if (selectedElement.type === 'photo') {
      dispatch({
        type: 'UPDATE_ELEMENT',
        id: selectedElement.id,
        updates: { filter },
      })
    }
  }

  const handleTextChange = (field: keyof TextElement, value: string | number) => {
    if (selectedElement.type === 'text') {
      dispatch({
        type: 'UPDATE_ELEMENT',
        id: selectedElement.id,
        updates: { [field]: value },
      })
    }
  }

  const handleDelete = () => {
    dispatch({ type: 'DELETE_ELEMENT', id: selectedElement.id })
  }

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-serif text-sm font-semibold capitalize">{selectedElement.type}</h3>
          <p className="font-mono text-xs text-muted-foreground">Edit properties</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: 'SELECT_ELEMENT', id: null })}
          className="w-7 h-7"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <Label className="font-mono text-xs">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="font-mono text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_ELEMENT',
                    id: selectedElement.id,
                    updates: { x: parseInt(e.target.value) || 0 },
                  })
                }
                className="font-mono text-xs h-8"
                disabled={selectedElement.locked}
              />
            </div>
            <div>
              <Label className="font-mono text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_ELEMENT',
                    id: selectedElement.id,
                    updates: { y: parseInt(e.target.value) || 0 },
                  })
                }
                className="font-mono text-xs h-8"
                disabled={selectedElement.locked}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="font-mono text-xs">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="font-mono text-xs text-muted-foreground">W</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_ELEMENT',
                    id: selectedElement.id,
                    updates: { width: parseInt(e.target.value) || 40 },
                  })
                }
                className="font-mono text-xs h-8"
                disabled={selectedElement.locked}
              />
            </div>
            <div>
              <Label className="font-mono text-xs text-muted-foreground">H</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_ELEMENT',
                    id: selectedElement.id,
                    updates: { height: parseInt(e.target.value) || 40 },
                  })
                }
                className="font-mono text-xs h-8"
                disabled={selectedElement.locked}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Rotation</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {selectedElement.rotation}°
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Slider
              value={[selectedElement.rotation]}
              onValueChange={handleRotationChange}
              min={-180}
              max={180}
              step={1}
              disabled={selectedElement.locked}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRotationChange([0])}
              disabled={selectedElement.locked}
              className="w-7 h-7"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Photo-specific: Filter */}
        {selectedElement.type === 'photo' && (
          <div className="space-y-2">
            <Label className="font-mono text-xs">Filter</Label>
            <div className="grid grid-cols-3 gap-1">
              {PHOTO_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  disabled={selectedElement.locked}
                  className={cn(
                    'px-2 py-1.5 rounded text-xs font-mono transition-colors',
                    (selectedElement as PhotoElement).filter === filter.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text-specific properties */}
        {selectedElement.type === 'text' && (
          <>
            <div className="space-y-2">
              <Label className="font-mono text-xs">Text Content</Label>
              <Input
                value={(selectedElement as TextElement).content}
                onChange={(e) => handleTextChange('content', e.target.value)}
                className="font-mono text-xs"
                disabled={selectedElement.locked}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Font Size</Label>
              <Slider
                value={[(selectedElement as TextElement).fontSize]}
                onValueChange={(v) => handleTextChange('fontSize', v[0])}
                min={12}
                max={72}
                step={1}
                disabled={selectedElement.locked}
              />
              <span className="font-mono text-xs text-muted-foreground">
                {(selectedElement as TextElement).fontSize}px
              </span>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Color</Label>
              <Input
                type="color"
                value={(selectedElement as TextElement).color}
                onChange={(e) => handleTextChange('color', e.target.value)}
                className="h-8 w-full"
                disabled={selectedElement.locked}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-3 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleLock}
          className="w-full gap-2 font-mono text-xs"
        >
          {selectedElement.locked ? (
            <>
              <Unlock className="w-3 h-3" />
              Unlock Element
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Lock Element
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="w-full font-mono text-xs"
        >
          Delete Element
        </Button>
      </div>
    </div>
  )
}
