'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ErrorState =
  | { type: 'per_ip_limit'; message: string; retryAfter: number }
  | { type: 'global_cap'; message: string }
  | { type: 'unknown'; message: string }

export default function NewEventPage() {
  const router = useRouter()
  const [error, setError] = useState<ErrorState | null>(null)

  useEffect(() => {
    async function create() {
      try {
        const res = await fetch('/api/event/new', { method: 'POST' })
        const data = await res.json()

        if (res.ok) {
          router.replace(`/event/${data.id}`)
          return
        }

        if (data.error === 'per_ip_limit') {
          setError({ type: 'per_ip_limit', message: data.message, retryAfter: data.retryAfter })
        } else if (data.error === 'global_cap') {
          setError({ type: 'global_cap', message: data.message })
        } else {
          setError({ type: 'unknown', message: 'Something went wrong. Please try again.' })
        }
      } catch {
        setError({ type: 'unknown', message: 'Could not connect. Please check your connection and try again.' })
      }
    }

    create()
  }, [router])

  if (!error) {
    // Loading state while the API responds
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'oklch(0.975 0.008 60)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce select-none" aria-hidden>🎞️</span>
          <p
            className="text-sm tracking-widest uppercase text-[oklch(0.6_0.025_55)]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            Setting up your canvas…
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        backgroundColor: 'oklch(0.975 0.008 60)',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 31px, oklch(0.87 0.018 58 / 0.35) 31px, oklch(0.87 0.018 58 / 0.35) 32px)',
      }}
    >
      <div
        className="bg-[oklch(0.995_0.004_65)] flex flex-col items-center text-center gap-5 px-8 py-10 max-w-sm w-full"
        style={{
          borderRadius: '1px',
          boxShadow: '4px 4px 0px oklch(0.65 0.13 48)',
        }}
      >
        {/* Tape strip decoration */}
        <div
          className="w-16 h-5 opacity-75 -rotate-2"
          style={{ backgroundColor: '#f5c5ba', borderRadius: '1px', marginTop: '-2.5rem' }}
          aria-hidden
        />

        <span className="text-4xl select-none" aria-hidden>
          {error.type === 'per_ip_limit' ? '⏳' : '🌿'}
        </span>

        <div className="flex flex-col gap-2">
          <h1
            className="text-xl text-[oklch(0.18_0.02_50)]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {error.type === 'per_ip_limit' ? 'Come back soon' : 'Demo limit reached'}
          </h1>
          <p className="text-sm text-[oklch(0.5_0.025_55)] leading-relaxed">
            {error.message}
          </p>
        </div>

        {error.type === 'per_ip_limit' && (
          <span
            className="text-[10px] uppercase tracking-[0.2em] border border-[oklch(0.65_0.13_48)] text-[oklch(0.65_0.13_48)] px-3 py-1"
            style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '1px' }}
          >
            1 event per 2 hours · per person
          </span>
        )}

        <Link
          href="/"
          className="text-sm text-[oklch(0.5_0.025_55)] hover:text-[oklch(0.18_0.02_50)] transition-colors underline underline-offset-4"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
