import { use } from 'react'
import { SoloCanvasRoom } from '@/components/daymark/SoloCanvasRoom'

export default function CanvasEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <SoloCanvasRoom canvasId={id} />
}
