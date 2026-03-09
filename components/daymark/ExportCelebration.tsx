'use client'

import { useEffect, useState } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import { CANVAS_THEMES } from '@/lib/types'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  size: number
  shape: 'circle' | 'rect'
  duration: number
}

interface ToastState {
  visible: boolean
  nudgeVisible: boolean
}

export function ExportCelebration() {
  const { state, dispatch } = useDayMark()
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [toast, setToast] = useState<ToastState>({ visible: false, nudgeVisible: false })

  const themeConfig = CANVAS_THEMES.find((t) => t.id === state.canvasTheme)
  const accentColors = themeConfig?.accentColors ?? ['#e8b4b8', '#f7d5b2', '#b8d8c8']

  useEffect(() => {
    if (!state.showCelebration) return

    // 60 confetti pieces in current theme's accent colours
    const pieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: accentColors[Math.floor(Math.random() * accentColors.length)],
      delay: Math.random() * 0.6,
      size: Math.random() * 9 + 5,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      duration: 1.6 + Math.random() * 0.8,
    }))
    setConfetti(pieces)
    setToast({ visible: true, nudgeVisible: false })

    // Account nudge appears 1.5s after toast
    const nudgeTimer = setTimeout(() => {
      setToast((t) => ({ ...t, nudgeVisible: true }))
    }, 1500)

    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setToast({ visible: false, nudgeVisible: false })
      setConfetti([])
      dispatch({ type: 'SHOW_CELEBRATION', show: false })
    }, 4500)

    return () => {
      clearTimeout(nudgeTimer)
      clearTimeout(dismissTimer)
    }
  }, [state.showCelebration]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!state.showCelebration && confetti.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes toast-in {
          0%   { transform: translateY(24px) scale(0.92); opacity: 0; }
          60%  { transform: translateY(-4px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes nudge-in {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Confetti layer */}
      <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              left: `${piece.x}%`,
              top: -piece.size,
              width: piece.shape === 'rect' ? piece.size * 0.5 : piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : '1px',
              animationName: 'confetti-fall',
              animationDuration: `${piece.duration}s`,
              animationDelay: `${piece.delay}s`,
              animationTimingFunction: 'ease-in',
              animationFillMode: 'forwards',
            }}
          />
        ))}
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[160] flex flex-col items-center gap-2"
          style={{ animationName: 'toast-in', animationDuration: '0.4s', animationFillMode: 'forwards' }}
        >
          <div className="bg-card border border-border rounded-xl px-6 py-3 shadow-xl text-center min-w-[240px]">
            <p className="font-serif text-base font-semibold">Exported at 2&times; &mdash; gorgeous.</p>
          </div>

          {/* Account nudge — appears 1.5s later */}
          {toast.nudgeVisible && (
            <div
              className="bg-card/90 border border-border/60 rounded-lg px-4 py-2 shadow text-center"
              style={{ animationName: 'nudge-in', animationDuration: '0.3s', animationFillMode: 'forwards' }}
            >
              <p className="font-mono text-xs text-muted-foreground">
                Save this to your library?{' '}
                <button className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors">
                  Sign up
                </button>
                {' '}·{' '}
                <button className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors">
                  Log in
                </button>
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
