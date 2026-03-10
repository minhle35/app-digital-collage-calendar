export interface BackdropPreset {
  id: string
  name: string
  /** CSS value for the small thumbnail preview button */
  preview: string
  /** Renders the backdrop onto a canvas context */
  render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

export const BOOTH_BACKDROPS: BackdropPreset[] = [
  {
    id: 'polaroid',
    name: 'Polaroid',
    preview: '#fefcf8',
    render: (ctx, w, h) => {
      ctx.fillStyle = '#fefcf8'
      ctx.fillRect(0, 0, w, h)
    },
  },
  {
    id: 'milk-tea',
    name: 'Milk Tea',
    preview: 'linear-gradient(135deg, #f5ede4, #eddcc5)',
    render: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#f5ede4')
      g.addColorStop(1, '#eddcc5')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    preview: 'linear-gradient(135deg, #fde8e8, #f5c2c7)',
    render: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#fde8e8')
      g.addColorStop(1, '#f5c2c7')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    },
  },
  {
    id: 'garden',
    name: 'Garden',
    preview: 'linear-gradient(135deg, #e8f0e3, #d4e2cc)',
    render: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#e8f0e3')
      g.addColorStop(1, '#d4e2cc')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    },
  },
  {
    id: 'night',
    name: 'Night',
    preview: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    render: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#1a1a2e')
      g.addColorStop(1, '#16213e')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      // Deterministic stars using golden-ratio spacing
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      for (let i = 0; i < 45; i++) {
        const x = ((i * 0.6180339887) % 1) * w
        const y = ((i * 0.3819660112) % 1) * h
        const r = i % 5 === 0 ? 1.4 : 0.7
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
]
