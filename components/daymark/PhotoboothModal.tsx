'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import { generateElementId, type PhotoElement } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, Camera, ImagePlus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoboothModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CaptureState = 'idle' | 'countdown' | 'capturing' | 'done' | 'placing'

const TOTAL_SHOTS = 4
const COUNTDOWN_FROM = 3
const GAP_MS = 3000 // 3 seconds between shots

// Strip reveal clip-path animation — rolls down from top like a print emerging
const STRIP_REVEAL_CSS = `
@keyframes strip-reveal {
  0%   { clip-path: inset(0 0 100% 0); }
  100% { clip-path: inset(0 0 0% 0); }
}
.strip-reveal {
  animation: strip-reveal 0.8s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}
`

// Frame slide-in from above as shots are taken
const FRAME_SLIDE_CSS = `
@keyframes frame-slide {
  0%   { transform: translateY(-24px); opacity: 0; }
  60%  { transform: translateY(4px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}
.frame-slide {
  animation: frame-slide 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`

export function PhotoboothModal({ open, onOpenChange }: PhotoboothModalProps) {
  const { state, dispatch } = useDayMark()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [countdown, setCountdown] = useState(0)
  const [frames, setFrames] = useState<string[]>([])
  const [cameraError, setCameraError] = useState(false)
  const [placingReveal, setPlacingReveal] = useState(false)

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setCameraError(true)
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    if (open) {
      setFrames([])
      setCaptureState('idle')
      setPlacingReveal(false)
      startCamera()
    } else {
      stopCamera()
    }
    return () => { stopCamera() }
  }, [open, startCamera, stopCamera])

  // Capture a single frame
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Mirror flip (selfie feel)
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    ctx.restore()
    return canvas.toDataURL('image/jpeg', 0.9)
  }, [])

  // Run the full 4-shot sequence
  const runSequence = useCallback(async () => {
    const captured: string[] = []
    for (let shot = 0; shot < TOTAL_SHOTS; shot++) {
      // Countdown 3-2-1
      for (let c = COUNTDOWN_FROM; c >= 1; c--) {
        setCountdown(c)
        setCaptureState('countdown')
        await new Promise((r) => setTimeout(r, 900))
      }
      // Shutter flash + capture
      setCaptureState('capturing')
      setCountdown(0)
      const dataUrl = captureFrame()
      if (dataUrl) {
        captured.push(dataUrl)
        setFrames([...captured])
      }
      await new Promise((r) => setTimeout(r, 200))
      setCaptureState('idle')

      if (shot < TOTAL_SHOTS - 1) {
        // Gap between shots
        await new Promise((r) => setTimeout(r, GAP_MS))
      }
    }
    setCaptureState('done')
  }, [captureFrame])

  // Place strip on canvas
  const placeStrip = useCallback(() => {
    if (frames.length === 0) return
    setCaptureState('placing')
    setPlacingReveal(true)

    // Create a composite strip from the 4 frames
    const stripCanvas = document.createElement('canvas')
    const frameW = 120
    const frameH = 120
    const padding = 4
    stripCanvas.width = frameW + padding * 2
    stripCanvas.height = (frameH + padding) * TOTAL_SHOTS + padding
    const ctx = stripCanvas.getContext('2d')
    if (!ctx) return

    // White strip background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height)

    const imgs = frames.map((src) => {
      const img = new window.Image()
      img.src = src
      return img
    })

    const drawAll = () => {
      imgs.forEach((img, i) => {
        const y = padding + i * (frameH + padding)
        ctx.drawImage(img, padding, y, frameW, frameH)
      })

      // In Milestone mode, overlay day stamp on bottom frame
      if (state.mode === 'milestone') {
        const label = state.milestone
          ? `Day ${Math.ceil((Date.now() - state.milestone.startDate.getTime()) / (1000 * 60 * 60 * 24))}`
          : 'Today'
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(padding, stripCanvas.height - 24, frameW, 20)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(label, padding + frameW / 2, stripCanvas.height - 9)
      }

      const dataUrl = stripCanvas.toDataURL('image/png', 1.0)
      const el: PhotoElement = {
        id: generateElementId(),
        type: 'photo',
        x: 260,
        y: 80,
        width: stripCanvas.width * 1.2,
        height: stripCanvas.height * 1.2,
        rotation: -2,
        zIndex: state.elements.length,
        locked: false,
        src: dataUrl,
        filter: 'none',
      }
      dispatch({ type: 'ADD_ELEMENT', element: el })
      setTimeout(() => {
        onOpenChange(false)
        setPlacingReveal(false)
      }, 900)
    }

    // Wait for all images to load
    let loaded = 0
    imgs.forEach((img) => {
      if (img.complete) {
        loaded++
        if (loaded === imgs.length) drawAll()
      } else {
        img.onload = () => {
          loaded++
          if (loaded === imgs.length) drawAll()
        }
      }
    })
  }, [frames, state.elements.length, state.mode, state.milestone, dispatch, onOpenChange])

  // File upload fallback — compose 4 selected images
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, TOTAL_SHOTS)
    if (files.length === 0) return
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target?.result as string)
          reader.readAsDataURL(file)
        })
    )
    Promise.all(readers).then((dataUrls) => {
      setFrames(dataUrls)
      setCaptureState('done')
    })
    e.target.value = ''
  }, [])

  if (!open) return null

  const isFlashing = captureState === 'capturing'

  return (
    <>
      <style>{STRIP_REVEAL_CSS}{FRAME_SLIDE_CSS}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}
      >
        <div className="relative flex gap-6 items-start p-6 rounded-2xl bg-background/5 max-w-[680px] w-full mx-4">
          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: Camera/Upload */}
          <div className="flex flex-col items-center gap-4 flex-1 min-w-0">
            {/* Live preview */}
            <div className="relative w-full aspect-square max-w-[340px] rounded-xl overflow-hidden bg-black/80 border border-white/10">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                  <Camera className="w-10 h-10 opacity-40" />
                  <p className="font-mono text-sm text-center px-4">No camera? Upload 4 photos and we&apos;ll make the strip.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 font-mono text-xs"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Upload 4 Photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                    playsInline
                    muted
                  />
                  {/* Shutter flash */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-white pointer-events-none transition-opacity duration-100',
                      isFlashing ? 'opacity-80' : 'opacity-0'
                    )}
                  />
                  {/* Countdown overlay */}
                  {captureState === 'countdown' && countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span
                        className="text-white font-serif text-7xl font-bold"
                        style={{
                          animation: 'scale-pulse 0.9s ease-in-out',
                          textShadow: '0 0 20px rgba(0,0,0,0.5)',
                        }}
                        key={countdown}
                      >
                        {countdown}
                      </span>
                    </div>
                  )}
                  {/* Shot indicator */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {Array.from({ length: TOTAL_SHOTS }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors duration-150',
                          i < frames.length ? 'bg-white' : 'bg-white/25'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            {!cameraError && captureState !== 'done' && captureState !== 'placing' && (
              <div className="flex gap-3">
                <Button
                  onClick={runSequence}
                  disabled={captureState === 'countdown' || captureState === 'capturing'}
                  className="font-mono text-sm px-8 py-2 h-auto"
                >
                  {captureState === 'idle' && frames.length === 0 ? 'Start' : 'Retake'}
                </Button>
                {frames.length > 0 && captureState === 'idle' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setFrames([]); setCaptureState('idle') }}
                    className="gap-1.5 font-mono text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            )}

            {captureState === 'done' && (
              <Button
                onClick={placeStrip}
                className="font-mono text-sm px-8 py-2 h-auto"
              >
                Place on canvas
              </Button>
            )}
          </div>

          {/* Right: Film strip preview */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <p className="font-mono text-xs text-white/40 mb-1 tracking-wider uppercase">Strip</p>
            <div
              className={cn(
                'w-[88px] rounded-sm bg-white/5 border border-white/10 flex flex-col gap-1 p-1',
                captureState === 'placing' && 'strip-reveal'
              )}
              style={{ minHeight: 360 }}
            >
              {Array.from({ length: TOTAL_SHOTS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-full rounded-sm overflow-hidden bg-black/40',
                    frames[i] && 'frame-slide'
                  )}
                  style={{ height: 80 }}
                >
                  {frames[i] ? (
                    <img
                      src={frames[i]}
                      alt={`Shot ${i + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-xs text-white/20">{i + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scale-pulse {
          0%   { transform: scale(1.0); }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1.0); }
        }
      `}</style>
    </>
  )
}
