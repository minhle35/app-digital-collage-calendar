// ===== Canvas Element Types =====
export type ElementType = 'photo' | 'sticker' | 'text' | 'shape' | 'washi' | 'highlight'

export interface CanvasElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  locked: boolean
  // Index signature required for Liveblocks LsonObject compatibility
  [key: string]: string | number | boolean | undefined | null
}

export interface PhotoElement extends CanvasElement {
  type: 'photo'
  src: string // base64 data URL
  filter: PhotoFilter
}

export interface StickerElement extends CanvasElement {
  type: 'sticker'
  stickerId: string
  category: StickerCategory
  isNew?: boolean // used to trigger spring-pop animation once
}

export interface TextElement extends CanvasElement {
  type: 'text'
  content: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  textAlign: 'left' | 'center' | 'right'
  isEditing?: boolean
}

export interface ShapeElement extends CanvasElement {
  type: 'shape'
  shape: 'rectangle' | 'circle' | 'line'
  fill: string
  stroke: string
  strokeWidth: number
}

// Washi tape strip — drawn by click-drag, rendered as a thin colored rectangle
export interface WashiElement extends CanvasElement {
  type: 'washi'
  color: string    // hex color
  opacity: number  // 0–1, typically 0.7
  pattern?: 'solid' | 'dots' | 'stripes' | 'flowers'
}

// Highlighter stroke — horizontal mark with bleed at endpoints
export interface HighlightElement extends CanvasElement {
  type: 'highlight'
  color: string   // hex, typically semi-transparent
  strokeHeight: number // px, typically 16
}

export type AnyElement = PhotoElement | StickerElement | TextElement | ShapeElement | WashiElement | HighlightElement

// ===== Canvas Style (paper/notebook texture) =====
export type CanvasStyle = 'blank' | 'ruled' | 'grid' | 'dots'

export interface CanvasStyleConfig {
  id: CanvasStyle
  name: string
  icon: string
}

export const CANVAS_STYLES: CanvasStyleConfig[] = [
  { id: 'blank',  name: 'Blank',  icon: '□' },
  { id: 'ruled',  name: 'Ruled',  icon: '≡' },
  { id: 'grid',   name: 'Grid',   icon: '⊞' },
  { id: 'dots',   name: 'Dots',   icon: '∷' },
]

// ===== Theme System =====
export type CanvasTheme =
  | 'soft-milk'
  | 'matcha-cafe'
  | 'midnight-cafe'
  | 'soft-lofi'
  | 'archive-beige'
  | 'cloud-white'

export type StickerPack =
  | 'pastel-kawaii'
  | 'dark-academia'
  | 'botanical'
  | 'cottagecore'
  | 'minimal-mono'

export type PhotoFilter =
  | 'none'
  | 'vintage'
  | 'minimal'
  | 'pastel'
  | 'newspaper'
  | 'neon'

export interface CanvasThemeConfig {
  id: CanvasTheme
  name: string
  bgClass: string
  textClass: string
  isDark: boolean
  accentColors: string[] // for confetti + themed elements
}

export interface StickerPackConfig {
  id: StickerPack
  name: string
  description: string
  stickers: Sticker[]
}

export interface Sticker {
  id: string
  name: string
  emoji: string
  category: StickerCategory
  keywords: string[] // for search
}

export type StickerCategory =
  | 'decorative'
  | 'frames'
  | 'text-labels'
  | 'nature'
  | 'symbols'

// ===== App Mode =====
export type AppMode = 'study' | 'milestone'

// ===== Milestone data =====
export interface MilestoneData {
  name: string
  startDate: Date
  endDate: Date | null // null = open-ended (e.g. grief recovery)
}

// ===== Date Context =====
export interface DateContext {
  moonPhase: string
  weather: string
  headline: string
  dayFact: string
  daysRelative: string
  dayOfWeek: string
}

// ===== App State =====
export type ToolMode = 'select' | 'photo' | 'sticker' | 'text' | 'washi' | 'highlight' | 'pan'

export interface DayMarkState {
  // Mode
  mode: AppMode
  milestone: MilestoneData | null

  // Date selection
  selectedDate: Date | null
  dateContext: DateContext | null

  // Canvas
  elements: AnyElement[]
  selectedElementId: string | null
  canvasTheme: CanvasTheme
  stickerPack: StickerPack

  // Tool state
  activeTool: ToolMode
  activeWashiColor: string
  activeHighlightColor: string
  isStickersOpen: boolean

  // Undo history (last 50 states)
  history: AnyElement[][]
  historyIndex: number

  // Export
  isExporting: boolean
  showCelebration: boolean
  exportedImageUrl: string | null
  memoryId: string | null

  // Cloud sync
  isHydrated: boolean  // true once cloud state is loaded (or confirmed empty)
}

export type DayMarkAction =
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'SET_MILESTONE'; milestone: MilestoneData }
  | { type: 'SET_DATE'; date: Date }
  | { type: 'SET_DATE_CONTEXT'; context: DateContext }
  | { type: 'ADD_ELEMENT'; element: AnyElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<AnyElement> }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'SELECT_ELEMENT'; id: string | null }
  | { type: 'REORDER_ELEMENT'; id: string; direction: 'up' | 'down' | 'top' | 'bottom' }
  | { type: 'SET_CANVAS_THEME'; theme: CanvasTheme }
  | { type: 'SET_STICKER_PACK'; pack: StickerPack }
  | { type: 'SET_TOOL'; tool: ToolMode }
  | { type: 'SET_WASHI_COLOR'; color: string }
  | { type: 'SET_HIGHLIGHT_COLOR'; color: string }
  | { type: 'TOGGLE_STICKERS'; isOpen?: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY' } // snapshot current elements to history
  | { type: 'START_EXPORT' }
  | { type: 'FINISH_EXPORT'; imageUrl: string; memoryId: string }
  | { type: 'SHOW_CELEBRATION'; show: boolean }
  | { type: 'RESET' }
  | {
      type: 'LOAD_CANVAS'
      payload: {
        elements: AnyElement[]
        canvasTheme: CanvasTheme
        mode: AppMode
        selectedDate: Date | null
        milestone: MilestoneData | null
        stickerPack: StickerPack
      }
    }

// ===== Constants =====
export const CANVAS_THEMES: CanvasThemeConfig[] = [
  {
    id: 'soft-milk',
    name: 'Soft Milk',
    bgClass: 'canvas-soft-milk',
    textClass: 'text-foreground',
    isDark: false,
    accentColors: ['#e8b4b8', '#f7d5b2', '#b8d8c8', '#c8b4d8', '#f0d8a0'],
  },
  {
    id: 'matcha-cafe',
    name: 'Matcha Cafe',
    bgClass: 'canvas-matcha-cafe',
    textClass: 'text-foreground',
    isDark: false,
    accentColors: ['#7cb87c', '#a8d0a8', '#c8e0b0', '#e0f0d0', '#84b890'],
  },
  {
    id: 'midnight-cafe',
    name: 'Midnight Cafe',
    bgClass: 'canvas-midnight-cafe',
    textClass: 'text-white',
    isDark: true,
    accentColors: ['#8888ff', '#cc88cc', '#88ccff', '#ffcc88', '#ff8888'],
  },
  {
    id: 'soft-lofi',
    name: 'Soft Lofi',
    bgClass: 'canvas-soft-lofi',
    textClass: 'text-foreground',
    isDark: false,
    accentColors: ['#e8b090', '#d4a878', '#c89060', '#e8c8a8', '#d8b090'],
  },
  {
    id: 'archive-beige',
    name: 'Archive Beige',
    bgClass: 'canvas-archive-beige',
    textClass: 'text-foreground',
    isDark: false,
    accentColors: ['#c0a880', '#a89060', '#d0b898', '#b8a078', '#c8b088'],
  },
  {
    id: 'cloud-white',
    name: 'Cloud White',
    bgClass: 'canvas-cloud-white',
    textClass: 'text-foreground',
    isDark: false,
    accentColors: ['#a0c0e8', '#c0a8e0', '#a8d0a8', '#e8c8a0', '#f0a8a8'],
  },
]

export const PHOTO_FILTERS: { id: PhotoFilter; name: string; filterStyle: string }[] = [
  { id: 'none', name: 'Original', filterStyle: '' },
  { id: 'vintage', name: 'Vintage', filterStyle: 'sepia(0.6) contrast(1.1) brightness(0.95) saturate(0.8)' },
  { id: 'minimal', name: 'Minimal', filterStyle: 'grayscale(0.15) contrast(1.05) brightness(1.02)' },
  { id: 'pastel', name: 'Pastel', filterStyle: 'saturate(0.7) brightness(1.08) hue-rotate(15deg) contrast(0.92)' },
  { id: 'newspaper', name: 'Newspaper', filterStyle: 'grayscale(1) contrast(1.3) brightness(0.9)' },
  { id: 'neon', name: 'Neon', filterStyle: 'saturate(1.8) contrast(1.2) brightness(0.85) hue-rotate(-20deg)' },
]

// Washi tape color options
export const WASHI_COLORS = [
  { id: 'blush', color: '#f4c2c2', label: 'Blush' },
  { id: 'sage', color: '#b2c9b0', label: 'Sage' },
  { id: 'sky', color: '#b0c8e0', label: 'Sky' },
  { id: 'lavender', color: '#c8b8d8', label: 'Lavender' },
  { id: 'butter', color: '#f0e0a0', label: 'Butter' },
  { id: 'peach', color: '#f0c8a0', label: 'Peach' },
  { id: 'mint', color: '#a8d8c0', label: 'Mint' },
  { id: 'warm', color: '#d4a878', label: 'Warm' },
]

// Highlighter color options
export const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#ffe66d', label: 'Yellow' },
  { id: 'pink', color: '#ff9ec4', label: 'Pink' },
  { id: 'green', color: '#9ef0c0', label: 'Green' },
  { id: 'blue', color: '#9ec8f0', label: 'Blue' },
  { id: 'orange', color: '#ffb86c', label: 'Orange' },
  { id: 'purple', color: '#d0a8f0', label: 'Purple' },
]

// Sticker packs with keyword search maps
export const STICKER_PACKS: StickerPackConfig[] = [
  {
    id: 'pastel-kawaii',
    name: 'Pastel Kawaii',
    description: 'Cute and sweet pastel decorations',
    stickers: [
      { id: 'pk-star', name: 'Star', emoji: '⭐', category: 'decorative', keywords: ['star', 'sparkle', 'gold', 'shine', 'favorite', 'kawaii'] },
      { id: 'pk-heart', name: 'Pink Heart', emoji: '💖', category: 'decorative', keywords: ['heart', 'love', 'pink', 'cute', 'kawaii', 'sweet'] },
      { id: 'pk-sparkle', name: 'Sparkle', emoji: '✨', category: 'decorative', keywords: ['sparkle', 'shimmer', 'magic', 'glitter', 'shine'] },
      { id: 'pk-cloud', name: 'Cloud', emoji: '☁️', category: 'nature', keywords: ['cloud', 'sky', 'soft', 'white', 'weather', 'fluffy'] },
      { id: 'pk-rainbow', name: 'Rainbow', emoji: '🌈', category: 'nature', keywords: ['rainbow', 'colour', 'color', 'pastel', 'kawaii', 'happy'] },
      { id: 'pk-flower', name: 'Cherry Blossom', emoji: '🌸', category: 'nature', keywords: ['flower', 'pink', 'blossom', 'sakura', 'spring', 'kawaii', 'petal'] },
      { id: 'pk-bunny', name: 'Bunny', emoji: '🐰', category: 'decorative', keywords: ['bunny', 'rabbit', 'cute', 'kawaii', 'animal', 'soft'] },
      { id: 'pk-bow', name: 'Bow', emoji: '🎀', category: 'decorative', keywords: ['bow', 'ribbon', 'pink', 'cute', 'kawaii', 'gift', 'present'] },
      { id: 'pk-cake', name: 'Cake', emoji: '🍰', category: 'decorative', keywords: ['cake', 'sweet', 'birthday', 'dessert', 'food', 'kawaii'] },
      { id: 'pk-note', name: 'Memo', emoji: '📝', category: 'text-labels', keywords: ['note', 'memo', 'write', 'paper', 'label', 'list'] },
      { id: 'pk-frame', name: 'Frame', emoji: '🖼️', category: 'frames', keywords: ['frame', 'border', 'picture', 'art', 'decor'] },
      { id: 'pk-moon', name: 'Crescent Moon', emoji: '🌙', category: 'symbols', keywords: ['moon', 'night', 'crescent', 'sleep', 'sky', 'lunar'] },
      { id: 'pk-tulip', name: 'Tulip', emoji: '🌷', category: 'nature', keywords: ['tulip', 'flower', 'pink', 'spring', 'bloom'] },
      { id: 'pk-lollipop', name: 'Lollipop', emoji: '🍭', category: 'decorative', keywords: ['lollipop', 'candy', 'sweet', 'sugar', 'kawaii'] },
      { id: 'pk-butterfly', name: 'Butterfly', emoji: '🦋', category: 'nature', keywords: ['butterfly', 'pink', 'spring', 'flutter', 'nature'] },
    ],
  },
  {
    id: 'dark-academia',
    name: 'Dark Academia',
    description: 'Scholarly and vintage aesthetics',
    stickers: [
      { id: 'da-book', name: 'Books', emoji: '📚', category: 'decorative', keywords: ['book', 'study', 'read', 'library', 'academia', 'knowledge'] },
      { id: 'da-quill', name: 'Feather Quill', emoji: '🪶', category: 'decorative', keywords: ['quill', 'feather', 'pen', 'write', 'vintage', 'academia'] },
      { id: 'da-candle', name: 'Candle', emoji: '🕯️', category: 'decorative', keywords: ['candle', 'flame', 'light', 'vintage', 'gothic', 'dark'] },
      { id: 'da-scroll', name: 'Scroll', emoji: '📜', category: 'text-labels', keywords: ['scroll', 'parchment', 'ancient', 'paper', 'document', 'vintage'] },
      { id: 'da-key', name: 'Old Key', emoji: '🗝️', category: 'symbols', keywords: ['key', 'old', 'vintage', 'antique', 'mystery', 'unlock'] },
      { id: 'da-hourglass', name: 'Hourglass', emoji: '⏳', category: 'symbols', keywords: ['hourglass', 'time', 'sand', 'vintage', 'timer', 'clock'] },
      { id: 'da-compass', name: 'Compass', emoji: '🧭', category: 'symbols', keywords: ['compass', 'navigation', 'direction', 'vintage', 'explore', 'map'] },
      { id: 'da-coffee', name: 'Coffee', emoji: '☕', category: 'decorative', keywords: ['coffee', 'cafe', 'study', 'morning', 'drink', 'latte'] },
      { id: 'da-glasses', name: 'Glasses', emoji: '👓', category: 'decorative', keywords: ['glasses', 'spectacles', 'reading', 'study', 'scholar', 'academia'] },
      { id: 'da-skull', name: 'Skull', emoji: '💀', category: 'symbols', keywords: ['skull', 'dark', 'gothic', 'academia', 'memento', 'death'] },
      { id: 'da-frame', name: 'Frame', emoji: '🖼️', category: 'frames', keywords: ['frame', 'portrait', 'art', 'vintage', 'border', 'gallery'] },
      { id: 'da-telescope', name: 'Telescope', emoji: '🔭', category: 'symbols', keywords: ['telescope', 'astronomy', 'stars', 'science', 'observatory', 'study'] },
      { id: 'da-microscope', name: 'Microscope', emoji: '🔬', category: 'symbols', keywords: ['microscope', 'science', 'biology', 'lab', 'study', 'academia'] },
      { id: 'da-ink', name: 'Ink Fountain Pen', emoji: '🖊️', category: 'decorative', keywords: ['pen', 'ink', 'write', 'fountain', 'calligraphy', 'vintage'] },
      { id: 'da-map', name: 'Map', emoji: '🗺️', category: 'frames', keywords: ['map', 'vintage', 'explore', 'journey', 'navigation', 'treasure'] },
    ],
  },
  {
    id: 'botanical',
    name: 'Botanical',
    description: 'Leaves, flowers, and natural elements',
    stickers: [
      { id: 'bt-leaf', name: 'Leaf', emoji: '🍃', category: 'nature', keywords: ['leaf', 'green', 'plant', 'nature', 'botanical', 'spring'] },
      { id: 'bt-herb', name: 'Herb Sprig', emoji: '🌿', category: 'nature', keywords: ['herb', 'sprig', 'green', 'plant', 'nature', 'botanical', 'garden'] },
      { id: 'bt-flower', name: 'Hibiscus', emoji: '🌺', category: 'nature', keywords: ['flower', 'hibiscus', 'tropical', 'red', 'bloom', 'botanical'] },
      { id: 'bt-tulip', name: 'Tulip', emoji: '🌷', category: 'nature', keywords: ['tulip', 'flower', 'pink', 'spring', 'bloom', 'botanical'] },
      { id: 'bt-sunflower', name: 'Sunflower', emoji: '🌻', category: 'nature', keywords: ['sunflower', 'yellow', 'sunshine', 'summer', 'bloom', 'botanical'] },
      { id: 'bt-rose', name: 'Rose', emoji: '🌹', category: 'nature', keywords: ['rose', 'red', 'flower', 'love', 'bloom', 'botanical', 'garden'] },
      { id: 'bt-tree', name: 'Tree', emoji: '🌳', category: 'nature', keywords: ['tree', 'oak', 'green', 'nature', 'forest', 'botanical', 'woodland'] },
      { id: 'bt-mushroom', name: 'Mushroom', emoji: '🍄', category: 'nature', keywords: ['mushroom', 'fungi', 'forest', 'cottagecore', 'nature', 'woodland'] },
      { id: 'bt-butterfly', name: 'Butterfly', emoji: '🦋', category: 'nature', keywords: ['butterfly', 'spring', 'nature', 'blue', 'flutter', 'botanical'] },
      { id: 'bt-bee', name: 'Bee', emoji: '🐝', category: 'nature', keywords: ['bee', 'honey', 'yellow', 'nature', 'pollinate', 'botanical', 'garden'] },
      { id: 'bt-frame', name: 'Frame', emoji: '🖼️', category: 'frames', keywords: ['frame', 'border', 'botanical', 'art', 'decor'] },
      { id: 'bt-tag', name: 'Plant Label', emoji: '🏷️', category: 'text-labels', keywords: ['tag', 'label', 'plant', 'garden', 'note', 'botanical'] },
      { id: 'bt-cherry', name: 'Cherry', emoji: '🍒', category: 'nature', keywords: ['cherry', 'red', 'fruit', 'spring', 'botanical', 'garden'] },
      { id: 'bt-peach', name: 'Peach', emoji: '🍑', category: 'nature', keywords: ['peach', 'fruit', 'pink', 'soft', 'botanical', 'garden'] },
      { id: 'bt-fern', name: 'Seedling', emoji: '🌱', category: 'nature', keywords: ['seedling', 'sprout', 'grow', 'botanical', 'plant', 'new'] },
    ],
  },
  {
    id: 'cottagecore',
    name: 'Cottagecore',
    description: 'Rustic and cozy countryside vibes',
    stickers: [
      { id: 'cc-bread', name: 'Bread Loaf', emoji: '🍞', category: 'decorative', keywords: ['bread', 'loaf', 'bake', 'cottage', 'cozy', 'food', 'rustic'] },
      { id: 'cc-pie', name: 'Pie', emoji: '🥧', category: 'decorative', keywords: ['pie', 'bake', 'cottage', 'cozy', 'food', 'rustic', 'dessert'] },
      { id: 'cc-teapot', name: 'Teapot', emoji: '🫖', category: 'decorative', keywords: ['teapot', 'tea', 'cozy', 'afternoon', 'cottage', 'drink'] },
      { id: 'cc-basket', name: 'Wicker Basket', emoji: '🧺', category: 'decorative', keywords: ['basket', 'wicker', 'cottage', 'rustic', 'gather', 'cozy'] },
      { id: 'cc-yarn', name: 'Yarn Ball', emoji: '🧶', category: 'decorative', keywords: ['yarn', 'knit', 'craft', 'cottage', 'cozy', 'wool'] },
      { id: 'cc-house', name: 'Cottage', emoji: '🏡', category: 'decorative', keywords: ['cottage', 'house', 'home', 'cozy', 'rustic', 'countryside'] },
      { id: 'cc-duck', name: 'Duck', emoji: '🦆', category: 'nature', keywords: ['duck', 'bird', 'pond', 'cottage', 'nature', 'countryside'] },
      { id: 'cc-cow', name: 'Cow', emoji: '🐄', category: 'nature', keywords: ['cow', 'farm', 'cottage', 'countryside', 'milk', 'rustic'] },
      { id: 'cc-daisy', name: 'Blossom', emoji: '🌼', category: 'nature', keywords: ['daisy', 'flower', 'yellow', 'blossom', 'cottage', 'spring', 'meadow'] },
      { id: 'cc-sun', name: 'Sunshine', emoji: '☀️', category: 'symbols', keywords: ['sun', 'sunshine', 'warm', 'bright', 'summer', 'cottagecore', 'golden'] },
      { id: 'cc-frame', name: 'Frame', emoji: '🖼️', category: 'frames', keywords: ['frame', 'rustic', 'cottage', 'border', 'art'] },
      { id: 'cc-ribbon', name: 'Ribbon', emoji: '🎗️', category: 'decorative', keywords: ['ribbon', 'bow', 'cottage', 'rustic', 'awareness', 'decor'] },
      { id: 'cc-mushroom', name: 'Mushroom', emoji: '🍄', category: 'nature', keywords: ['mushroom', 'forest', 'cottagecore', 'fairy', 'woodland', 'nature'] },
      { id: 'cc-honey', name: 'Honey', emoji: '🍯', category: 'decorative', keywords: ['honey', 'jar', 'sweet', 'cottage', 'bee', 'golden', 'cozy'] },
      { id: 'cc-candle', name: 'Lit Candle', emoji: '🕯️', category: 'decorative', keywords: ['candle', 'cottage', 'cozy', 'light', 'warm', 'evening', 'flame'] },
    ],
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Clean black and white icons',
    stickers: [
      { id: 'mm-circle', name: 'Circle', emoji: '⚫', category: 'symbols', keywords: ['circle', 'round', 'minimal', 'dot', 'black', 'shape'] },
      { id: 'mm-square', name: 'Square', emoji: '⬛', category: 'symbols', keywords: ['square', 'block', 'minimal', 'black', 'shape', 'box'] },
      { id: 'mm-triangle', name: 'Triangle', emoji: '▲', category: 'symbols', keywords: ['triangle', 'shape', 'arrow', 'minimal', 'geometric'] },
      { id: 'mm-line', name: 'Line', emoji: '➖', category: 'symbols', keywords: ['line', 'dash', 'divider', 'minimal', 'separator'] },
      { id: 'mm-arrow', name: 'Arrow', emoji: '➡️', category: 'symbols', keywords: ['arrow', 'direction', 'point', 'minimal', 'next', 'forward'] },
      { id: 'mm-check', name: 'Check Mark', emoji: '✓', category: 'symbols', keywords: ['check', 'tick', 'done', 'complete', 'minimal', 'yes'] },
      { id: 'mm-x', name: 'X Mark', emoji: '✕', category: 'symbols', keywords: ['x', 'cross', 'no', 'cancel', 'minimal', 'remove'] },
      { id: 'mm-plus', name: 'Plus', emoji: '➕', category: 'symbols', keywords: ['plus', 'add', 'positive', 'minimal', 'cross', 'new'] },
      { id: 'mm-asterisk', name: 'Asterisk', emoji: '✱', category: 'symbols', keywords: ['asterisk', 'star', 'note', 'minimal', 'important'] },
      { id: 'mm-dot', name: 'Bullet', emoji: '•', category: 'symbols', keywords: ['dot', 'bullet', 'point', 'minimal', 'list', 'small'] },
      { id: 'mm-frame', name: 'Frame', emoji: '⬜', category: 'frames', keywords: ['frame', 'border', 'box', 'minimal', 'white', 'container'] },
      { id: 'mm-tag', name: 'Label', emoji: '🏷️', category: 'text-labels', keywords: ['tag', 'label', 'note', 'minimal', 'text', 'mark'] },
      { id: 'mm-corner', name: 'Corner', emoji: '◢', category: 'symbols', keywords: ['corner', 'angle', 'geometric', 'minimal', 'fold', 'triangle'] },
      { id: 'mm-diamond', name: 'Diamond', emoji: '◆', category: 'symbols', keywords: ['diamond', 'shape', 'minimal', 'geometric', 'solid', 'black'] },
      { id: 'mm-wave', name: 'Wave', emoji: '〰️', category: 'symbols', keywords: ['wave', 'squiggle', 'minimal', 'line', 'curve', 'flow'] },
    ],
  },
]

// ===== Utility Functions =====
export function generateElementId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

export function generateMemoryId(date: Date): string {
  const dateStr = date.toISOString().split('T')[0]
  const rand = Math.random().toString(36).substring(2, 7)
  return `dm-${dateStr}-${rand}`
}

// Search stickers by keyword
export function searchStickers(packs: StickerPackConfig[], query: string): Sticker[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return packs.flatMap((p) =>
    p.stickers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q)) ||
        s.emoji.includes(q)
    )
  )
}

// Mock async data fetcher for date context
export async function fetchDateContext(date: Date): Promise<DateContext> {
  await new Promise((r) => setTimeout(r, 600))

  const moonPhases = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
  ]
  const weathers = [
    '17°C, partly cloudy', '23°C, sunny', '9°C, overcast',
    '28°C, humid', '14°C, light rain', '19°C, clear',
  ]
  const headlines = [
    'Scientists discover high-energy cosmic rays from unknown source',
    'Record-breaking aurora visible across northern hemisphere',
    'New deep-sea species found in Pacific trench',
    'Ancient forest preserved beneath Antarctic ice',
  ]
  const dayFacts = [
    'Over 3,800 patents filed worldwide',
    'Unusually high tides recorded globally',
    'Meteor shower peaked in the night sky',
    'First day of a notable astronomical event',
  ]

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const daysRelative =
    diffDays === 0
      ? 'Today'
      : diffDays > 0
        ? `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`
        : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

  return {
    moonPhase: pick(moonPhases),
    weather: pick(weathers),
    headline: pick(headlines),
    dayFact: pick(dayFacts),
    daysRelative,
    dayOfWeek: days[date.getDay()],
  }
}

const MAX_HISTORY = 50

// Default initial state
export const INITIAL_STATE: DayMarkState = {
  mode: 'study',
  milestone: null,
  selectedDate: null,
  dateContext: null,
  elements: [],
  selectedElementId: null,
  canvasTheme: 'soft-milk',
  stickerPack: 'pastel-kawaii',
  activeTool: 'select',
  activeWashiColor: '#f4c2c2',
  activeHighlightColor: '#ffe66d',
  isStickersOpen: true,
  history: [[]],
  historyIndex: 0,
  isExporting: false,
  showCelebration: false,
  exportedImageUrl: null,
  memoryId: null,
  isHydrated: false,
}

// Reducer
export function dayMarkReducer(state: DayMarkState, action: DayMarkAction): DayMarkState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_MILESTONE':
      return { ...state, milestone: action.milestone }
    case 'SET_DATE':
      return { ...state, selectedDate: action.date }
    case 'SET_DATE_CONTEXT':
      return { ...state, dateContext: action.context }

    case 'PUSH_HISTORY': {
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push([...state.elements])
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      return { ...state, history: newHistory, historyIndex: newHistory.length - 1 }
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const prevIndex = state.historyIndex - 1
      return {
        ...state,
        historyIndex: prevIndex,
        elements: [...state.history[prevIndex]],
        selectedElementId: null,
      }
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const nextIndex = state.historyIndex + 1
      return {
        ...state,
        historyIndex: nextIndex,
        elements: [...state.history[nextIndex]],
        selectedElementId: null,
      }
    }

    case 'ADD_ELEMENT': {
      const newElements = [...state.elements, action.element]
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push([...newElements])
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      return {
        ...state,
        elements: newElements,
        selectedElementId: action.element.id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? ({ ...el, ...action.updates } as AnyElement) : el
        ),
      }
    case 'DELETE_ELEMENT': {
      const newElements = state.elements.filter((el) => el.id !== action.id)
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push([...newElements])
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      return {
        ...state,
        elements: newElements,
        selectedElementId: state.selectedElementId === action.id ? null : state.selectedElementId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }
    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.id }
    case 'REORDER_ELEMENT': {
      const idx = state.elements.findIndex((el) => el.id === action.id)
      if (idx === -1) return state
      const newElements = [...state.elements]
      const maxZ = Math.max(...newElements.map((e) => e.zIndex), 0)
      const minZ = Math.min(...newElements.map((e) => e.zIndex), 0)
      if (action.direction === 'top') {
        newElements[idx] = { ...newElements[idx], zIndex: maxZ + 1 }
      } else if (action.direction === 'bottom') {
        newElements[idx] = { ...newElements[idx], zIndex: minZ - 1 }
      } else if (action.direction === 'up') {
        newElements[idx] = { ...newElements[idx], zIndex: newElements[idx].zIndex + 1 }
      } else if (action.direction === 'down') {
        newElements[idx] = { ...newElements[idx], zIndex: newElements[idx].zIndex - 1 }
      }
      return { ...state, elements: newElements }
    }
    case 'SET_CANVAS_THEME':
      return { ...state, canvasTheme: action.theme }
    case 'SET_STICKER_PACK':
      return { ...state, stickerPack: action.pack }
    case 'SET_TOOL':
      return { ...state, activeTool: action.tool }
    case 'SET_WASHI_COLOR':
      return { ...state, activeWashiColor: action.color }
    case 'SET_HIGHLIGHT_COLOR':
      return { ...state, activeHighlightColor: action.color }
    case 'TOGGLE_STICKERS':
      return { ...state, isStickersOpen: action.isOpen ?? !state.isStickersOpen }
    case 'START_EXPORT':
      return { ...state, isExporting: true }
    case 'FINISH_EXPORT':
      return { ...state, isExporting: false, exportedImageUrl: action.imageUrl, memoryId: action.memoryId }
    case 'SHOW_CELEBRATION':
      return { ...state, showCelebration: action.show }
    case 'RESET':
      return { ...INITIAL_STATE, selectedDate: state.selectedDate, dateContext: state.dateContext, canvasTheme: state.canvasTheme }
    case 'LOAD_CANVAS':
      return {
        ...state,
        elements: action.payload.elements,
        canvasTheme: action.payload.canvasTheme,
        mode: action.payload.mode,
        selectedDate: action.payload.selectedDate,
        milestone: action.payload.milestone,
        stickerPack: action.payload.stickerPack,
        history: [action.payload.elements],
        historyIndex: 0,
        isHydrated: true,
      }
    default:
      return state
  }
}
