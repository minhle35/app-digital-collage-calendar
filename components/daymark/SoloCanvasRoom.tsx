'use client'

import { LiveObject } from '@liveblocks/client'
import { SoloRoomProvider, SOLO_CANVAS_DEFAULTS } from '@/lib/solo-liveblocks'
import { DayMarkApp } from './DayMarkApp'

interface SoloCanvasRoomProps {
  canvasId: string
}

export function SoloCanvasRoom({ canvasId }: SoloCanvasRoomProps) {
  return (
    <SoloRoomProvider
      id={`solo-canvas-${canvasId}`}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialStorage={{ canvas: new LiveObject(SOLO_CANVAS_DEFAULTS as any) }}
      initialPresence={{}}
    >
      <DayMarkApp />
    </SoloRoomProvider>
  )
}
