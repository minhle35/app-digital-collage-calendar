import { use } from 'react'

export default function SharedCanvasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <div>Shared Canvas: {slug}</div>
}
