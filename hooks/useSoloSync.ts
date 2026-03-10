'use client'

import { useEffect, useRef } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import { useSoloStorage, useSoloMutation, type SoloCanvasData } from '@/lib/solo-liveblocks'
import { fetchDateContext, INITIAL_STATE, type AnyElement, type MilestoneData } from '@/lib/types'

/**
 * Bridge between DayMarkContext (in-memory UI state) and Liveblocks
 * (cloud persistence) for the solo canvas.
 *
 * Flow:
 *  1. On mount, wait for Liveblocks to connect (canvas goes null → object).
 *  2. If cloud has elements, dispatch LOAD_CANVAS to restore state.
 *  3. If cloud is empty (new canvas), set today as date and mark hydrated.
 *  4. After hydration, debounce-sync every relevant state change back to cloud.
 */
export function useSoloSync() {
  const { state, dispatch } = useDayMark()
  const canvas = useSoloStorage((root) => root.canvas)
  const initialized = useRef(false)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncToCloud = useSoloMutation(({ storage }, data: SoloCanvasData) => {
    storage.get('canvas').update(data)
  }, [])

  // ── Step 1: Hydrate from cloud once on connect ───────────────────────────
  useEffect(() => {
    // canvas is null until Liveblocks connects; skip until ready
    if (canvas === null || initialized.current) return
    initialized.current = true

    const elements: AnyElement[] = JSON.parse(canvas.elementsJson || '[]')
    const hasData = elements.length > 0

    let selectedDate: Date | null = null
    if (canvas.selectedDateIso) {
      selectedDate = new Date(canvas.selectedDateIso)
    }

    let milestone: MilestoneData | null = null
    if (canvas.milestoneJson) {
      try {
        const raw = JSON.parse(canvas.milestoneJson)
        milestone = {
          ...raw,
          startDate: new Date(raw.startDate),
          endDate: raw.endDate ? new Date(raw.endDate) : null,
        }
      } catch { /* ignore malformed */ }
    }

    if (!selectedDate) {
      // New canvas — pick today and fetch its context
      selectedDate = new Date()
      fetchDateContext(selectedDate).then((context) => {
        dispatch({ type: 'SET_DATE_CONTEXT', context })
      })
    }

    dispatch({
      type: 'LOAD_CANVAS',
      payload: {
        elements,
        canvasTheme: canvas.canvasTheme ?? INITIAL_STATE.canvasTheme,
        mode: canvas.mode ?? INITIAL_STATE.mode,
        stickerPack: canvas.stickerPack ?? INITIAL_STATE.stickerPack,
        selectedDate,
        milestone,
      },
    })

    // Fetch date context for restored date (if loading existing canvas)
    if (hasData && selectedDate) {
      fetchDateContext(selectedDate).then((context) => {
        dispatch({ type: 'SET_DATE_CONTEXT', context })
      })
    }
  }, [canvas]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: Debounce-sync state changes back to cloud ────────────────────
  useEffect(() => {
    if (!state.isHydrated) return

    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      const data: SoloCanvasData = {
        canvasTheme: state.canvasTheme,
        mode: state.mode,
        stickerPack: state.stickerPack,
        selectedDateIso: state.selectedDate?.toISOString() ?? null,
        milestoneJson: state.milestone
          ? JSON.stringify({
              ...state.milestone,
              startDate: state.milestone.startDate.toISOString(),
              endDate: state.milestone.endDate?.toISOString() ?? null,
            })
          : null,
        elementsJson: JSON.stringify(state.elements),
      }
      syncToCloud(data)
    }, 1000) // 1 s debounce — avoids spamming Liveblocks on every keystroke

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    state.isHydrated,
    state.elements,
    state.canvasTheme,
    state.mode,
    state.stickerPack,
    state.selectedDate,
    state.milestone,
  ])
}
