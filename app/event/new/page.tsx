'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEventPage() {
  const router = useRouter()

  useEffect(() => {
    const id = Math.random().toString(36).slice(2, 10)
    router.replace(`/event/${id}`)
  }, [router])

  return null
}
