'use client'

import { useState, useCallback, useEffect } from 'react'
import { DayMarkProvider, useDayMark } from '@/lib/DayMarkContext'
import { fetchDateContext, generateElementId, INITIAL_STATE, type WashiElement, type AppMode } from '@/lib/types'
import { Canvas } from './Canvas'
import { Toolbar } from './Toolbar'
import { StickersPanel } from './StickersPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ExportDialog } from './ExportDialog'
import { ExportCelebration } from './ExportCelebration'
import { DatePickerDialog } from './DatePickerDialog'
import { PhotoboothModal } from './PhotoboothModal'
import { cn } from '@/lib/utils'

// Auto-place the initial washi strip after 2 seconds on first open
function useAutoWashi(hasElements: boolean, canvasReady: boolean) {
  const { dispatch } = useDayMark()
  useEffect(() => {
    if (!canvasReady || hasElements) return
    const timer = setTimeout(() => {
      const el: WashiElement = {
        id: generateElementId(),
        type: 'washi',
        x: 0,
        y: 80 + Math.random() * 40,
        width: 820 * 0.22,
        height: 18,
        rotation: (Math.random() - 0.5) * 3,
        zIndex: 0,
        locked: false,
        color: '#f4c2c2',
        opacity: 0.72,
        pattern: 'solid',
      }
      dispatch({ type: 'ADD_ELEMENT', element: el })
    }, 2000)
    return () => clearTimeout(timer)
    // Only run once when canvas first becomes ready and is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasReady])
}

function DayMarkInner() {
  const { state, dispatch } = useDayMark()
  const [showThemes, setShowThemes] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showPhotobooth, setShowPhotobooth] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)

  // Mark canvas as ready after initial mount
  useEffect(() => {
    const t = setTimeout(() => setCanvasReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Auto-washi on first open (only when canvas is empty)
  useAutoWashi(state.elements.length > 0, canvasReady)

  // Auto-load today's date on first open
  useEffect(() => {
    if (!state.selectedDate) {
      const today = new Date()
      dispatch({ type: 'SET_DATE', date: today })
      fetchDateContext(today).then((context) => {
        dispatch({ type: 'SET_DATE_CONTEXT', context })
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = useCallback(() => setShowExport(true), [])
  const handleOpenThemes = useCallback(() => setShowThemes(true), [])
  const handleOpenPhotobooth = useCallback(() => setShowPhotobooth(true), [])

  const handleModeChange = useCallback(
    (mode: AppMode) => {
      dispatch({ type: 'SET_MODE', mode })
    },
    [dispatch]
  )

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-11 border-b border-border px-4 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-base font-semibold tracking-tight">DayMark</h1>

          {/* Mode pills */}
          <div className="flex items-center bg-secondary/40 rounded-full p-0.5 gap-0.5">
            {(['study', 'milestone'] as AppMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={cn(
                  'px-3 py-1 rounded-full font-mono text-xs transition-all duration-200',
                  state.mode === m
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'study' ? 'Study Studio' : 'Milestone'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
            {state.elements.length > 0
              ? `${state.elements.length} element${state.elements.length !== 1 ? 's' : ''}`
              : 'Empty canvas'}
          </span>
          <button
            onClick={() => setShowDatePicker(true)}
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded-md px-2.5 py-1 hover:bg-secondary/40"
          >
            {state.selectedDate
              ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(state.selectedDate)
              : 'Pick a date'}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        onExport={handleExport}
        onOpenThemes={handleOpenThemes}
        onOpenPhotobooth={handleOpenPhotobooth}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas */}
        <Canvas />

        {/* Right sidebar — Properties when element selected, Stickers otherwise */}
        {state.selectedElementId ? <PropertiesPanel /> : <StickersPanel />}
      </div>

      {/* Dialogs & Overlays */}
      <DatePickerDialog open={showDatePicker} onOpenChange={setShowDatePicker} />
      <ThemeSwitcher open={showThemes} onOpenChange={setShowThemes} />
      <ExportDialog open={showExport} onOpenChange={setShowExport} />
      <PhotoboothModal open={showPhotobooth} onOpenChange={setShowPhotobooth} />
      <ExportCelebration />
    </div>
  )
}

export function DayMarkApp() {
  return (
    <DayMarkProvider>
      <DayMarkInner />
    </DayMarkProvider>
  )
}
