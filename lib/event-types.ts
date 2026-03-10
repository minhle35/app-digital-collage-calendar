import type { AnyElement, CanvasTheme } from './types'
import type { LiveList, LiveObject } from '@liveblocks/client'

// ===== Event Metadata =====
export interface EventMetadata {
  title: string
  date: string        // ISO "2026-03-15"
  startTime: string   // "14:00"
  endTime: string     // "15:30"
  location: string
  notes: string
  colorTag: string    // hex accent colour
  canvasTheme: CanvasTheme
}

export const DEFAULT_METADATA: EventMetadata = {
  title: 'Untitled event',
  date: new Date().toISOString().split('T')[0],
  startTime: '',
  endTime: '',
  location: '',
  notes: '',
  colorTag: '#c8a876',
  canvasTheme: 'soft-milk',
}

// ===== Liveblocks room schema =====
export type Storage = {
  elements: LiveList<AnyElement>
  metadata: LiveObject<EventMetadata>
}

export type Presence = {
  cursor: { x: number; y: number } | null
  name: string  // "Guest · abc123" auto-generated
}

// ===== Broadcast events =====
export type BroadcastEvent =
  // WebRTC signaling
  | { type: 'WEBRTC_OFFER';   to: number; from: number; sdp: string }
  | { type: 'WEBRTC_ANSWER';  to: number; from: number; sdp: string }
  | { type: 'WEBRTC_ICE';     to: number; from: number; candidate: RTCIceCandidateInit }
  // Photo booth flow
  | { type: 'PHOTO_READY';    from: number; name: string }
  | { type: 'PHOTO_ACCEPTED'; from: number }
  | { type: 'PHOTO_DECLINED'; from: number }
  | { type: 'COUNTDOWN_START'; initiator: number }
  | { type: 'PHOTO_FRAME';    from: number; dataUrl: string }

// ===== Guest name generation =====
const ADJECTIVES = ['quiet', 'gentle', 'golden', 'silver', 'warm', 'still', 'bright', 'soft']
const NOUNS = ['leaf', 'cloud', 'wave', 'stone', 'star', 'moon', 'wind', 'rain']

export function generateGuestName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 90) + 10
  return `${adj}-${noun}-${num}`
}

// Deterministic colour per connectionId for cursors / avatars
const CURSOR_COLOURS = [
  '#e07b54', '#6b9e78', '#7b8db8', '#c4956a',
  '#9b7bb8', '#5fa8a0', '#c4726a', '#7a9e6b',
]
export function connectionColour(connectionId: number): string {
  return CURSOR_COLOURS[connectionId % CURSOR_COLOURS.length]
}
