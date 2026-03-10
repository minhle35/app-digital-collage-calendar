import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { LiveObject } from '@liveblocks/client'
import type { CanvasTheme, AppMode, StickerPack } from './types'

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
})

// All persistent canvas state serialised into a single LiveObject.
// Elements are stored as JSON to avoid the complexity of a LiveList
// for a solo (non-concurrent) canvas.
export interface SoloCanvasData {
  canvasTheme: CanvasTheme
  mode: AppMode
  stickerPack: StickerPack
  selectedDateIso: string | null   // Date.toISOString()
  milestoneJson: string | null     // JSON with ISO date strings
  elementsJson: string             // JSON.stringify(AnyElement[])
}

export type SoloStorage = {
  canvas: LiveObject<SoloCanvasData>
}

export type SoloPresence = Record<string, never>

export const {
  RoomProvider: SoloRoomProvider,
  useStorage: useSoloStorage,
  useMutation: useSoloMutation,
  useStatus: useSoloStatus,
} = createRoomContext<SoloPresence, SoloStorage>(client)

export const SOLO_CANVAS_DEFAULTS: SoloCanvasData = {
  canvasTheme: 'soft-milk',
  mode: 'study',
  stickerPack: 'pastel-kawaii',
  selectedDateIso: null,
  milestoneJson: null,
  elementsJson: '[]',
}
