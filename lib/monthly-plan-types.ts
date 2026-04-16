export type PlanEntry = {
  id: string
  date: string         // ISO "2026-05-14"
  eventRoomId: string  // maps to /event/[eventRoomId]
  title: string
  colorTag: string     // hex from PLAN_COLORS
  createdAt: number
}

export const PLAN_COLORS = [
  { hex: '#f5c5ba', label: 'Blush' },
  { hex: '#b8dfc8', label: 'Sage' },
  { hex: '#b8cff5', label: 'Sky' },
  { hex: '#f5e8a0', label: 'Butter' },
  { hex: '#d4b8f5', label: 'Lavender' },
  { hex: '#f5c8a0', label: 'Peach' },
]
