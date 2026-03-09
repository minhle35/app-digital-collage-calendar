'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCanvasPage() {
  const router = useRouter()

  useEffect(() => {
    const id = Math.random().toString(36).slice(2, 10)
    router.replace(`/canvas/${id}`)
  }, [router])

  return null
}
