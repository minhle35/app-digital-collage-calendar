'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useBroadcastEvent, useEventListener, useMutation, useOthers, useSelf, useStorage } from '@/lib/liveblocks'
import { generateElementId, type PhotoElement, type AnyElement, type CanvasTheme } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, Camera } from 'lucide-react'

type BoothStage =
  | 'idle'           // waiting for the other person
  | 'ready-sent'     // I hit READY, waiting for them
  | 'prompt'         // they hit READY, asking me
  | 'countdown'      // both ready, counting down
  | 'flash'          // white flash
  | 'strip'          // show strip, place on canvas

interface PhotoBoothOverlayProps {
  onClose: () => void
  selfName: string
  canvasTheme: CanvasTheme
}

export function PhotoBoothOverlay({ onClose, selfName, canvasTheme }: PhotoBoothOverlayProps) {
  const self = useSelf()
  const others = useOthers()
  const broadcast = useBroadcastEvent()
  const elements = useStorage((root) => root.elements)
  const myId = self?.connectionId ?? -1

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage] = useState<BoothStage>('idle')
  const [countdown, setCountdown] = useState(5)
  const [myFrame, setMyFrame] = useState<string | null>(null)
  const [theirFrame, setTheirFrame] = useState<string | null>(null)
  const [promptFrom, setPromptFrom] = useState<{ id: number; name: string } | null>(null)
  const [initiatorId, setInitiatorId] = useState<number | null>(null)
  const [camError, setCamError] = useState(false)

  const hasOthers = others.length > 0

  // Start camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCamError(true))

    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])

  // Capture a frame from the webcam into a base64 PNG
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    if (!video) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }, [])

  // Stitch two frames side-by-side with white polaroid border
  const stitchFrames = useCallback((frameA: string, frameB: string): Promise<string> => {
    return new Promise((resolve) => {
      const imgA = new window.Image()
      const imgB = new window.Image()
      let loaded = 0
      const tryStitch = () => {
        if (++loaded < 2) return
        const pad = 16
        const w = 320
        const h = Math.round(w * (imgA.height / imgA.width))
        const canvas = document.createElement('canvas')
        canvas.width = w * 2 + pad * 3
        canvas.height = h + pad * 2
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#fefcf8'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // slight drop shadow between frames
        ctx.shadowColor = 'rgba(0,0,0,0.08)'
        ctx.shadowBlur = 8
        ctx.drawImage(imgA, pad, pad, w, h)
        ctx.drawImage(imgB, pad * 2 + w, pad, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      imgA.onload = tryStitch; imgA.src = frameA
      imgB.onload = tryStitch; imgB.src = frameB
    })
  }, [])

  // Add final stitched photo to the shared canvas
  const addMutation = useMutation(({ storage }, src: string, width: number, height: number) => {
    const list = storage.get('elements')
    const el: PhotoElement = {
      id: generateElementId(), type: 'photo',
      x: 80, y: 80,
      width, height,
      rotation: (Math.random() - 0.5) * 3,
      zIndex: list.toArray().length,
      locked: false, src, filter: 'none',
    }
    list.push(el)
  }, [])

  const placeOnCanvas = useCallback(async () => {
    if (!myFrame || !theirFrame) return
    // Initiator stitches; non-initiator just waits for the canvas to update
    if (initiatorId !== myId) return
    const stitched = await stitchFrames(
      initiatorId === myId ? myFrame : theirFrame,
      initiatorId === myId ? theirFrame : myFrame,
    )
    const img = new window.Image()
    img.onload = () => addMutation(stitched, img.width / 2, img.height / 2)
    img.src = stitched
    onClose()
  }, [myFrame, theirFrame, initiatorId, myId, stitchFrames, addMutation, onClose])

  // Auto-place when both frames are received
  useEffect(() => {
    if (stage === 'strip' && myFrame && theirFrame && initiatorId === myId) {
      placeOnCanvas()
    }
  }, [stage, myFrame, theirFrame, initiatorId, myId, placeOnCanvas])

  // Countdown logic
  useEffect(() => {
    if (stage !== 'countdown') return
    if (countdown === 0) {
      setStage('flash')
      const frame = captureFrame()
      if (frame) {
        setMyFrame(frame)
        broadcast({ type: 'PHOTO_FRAME', from: myId, dataUrl: frame })
      }
      setTimeout(() => setStage('strip'), 600)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [stage, countdown, captureFrame, broadcast, myId])

  // Handle incoming broadcast events
  useEventListener(({ event }) => {
    if (event.type === 'PHOTO_READY') {
      if (stage === 'idle') {
        setPromptFrom({ id: event.from, name: event.name })
        setStage('prompt')
      }
    }
    if (event.type === 'PHOTO_ACCEPTED') {
      if (stage === 'ready-sent') startCountdown(myId)
    }
    if (event.type === 'PHOTO_DECLINED') {
      setStage('idle')
    }
    if (event.type === 'COUNTDOWN_START') {
      setInitiatorId(event.initiator)
      setCountdown(5)
      setStage('countdown')
    }
    if (event.type === 'PHOTO_FRAME') {
      setTheirFrame(event.dataUrl)
    }
  })

  const startCountdown = (initiator: number) => {
    broadcast({ type: 'COUNTDOWN_START', initiator })
    setInitiatorId(initiator)
    setCountdown(5)
    setStage('countdown')
  }

  const handleReady = () => {
    setStage('ready-sent')
    broadcast({ type: 'PHOTO_READY', from: myId, name: selfName })
  }

  const handleAccept = () => {
    if (!promptFrom) return
    broadcast({ type: 'PHOTO_ACCEPTED', from: myId })
    startCountdown(promptFrom.id)
  }

  const handleDecline = () => {
    broadcast({ type: 'PHOTO_DECLINED', from: myId })
    setStage('idle')
    setPromptFrom(null)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center">
      <div className="relative bg-card rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Live camera feed */}
        <div className="relative bg-black aspect-video">
          {camError ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/60">
              <Camera className="w-10 h-10" />
              <p className="font-mono text-sm">Camera access denied</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          )}

          {/* Countdown overlay */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-white text-8xl font-bold drop-shadow-lg"
                style={{ animation: 'spring-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                key={countdown}
              >
                {countdown === 0 ? '✦' : countdown}
              </span>
            </div>
          )}

          {/* White flash */}
          {stage === 'flash' && (
            <div className="absolute inset-0 bg-white animate-in fade-in duration-75 fade-out" />
          )}
        </div>

        {/* Controls area */}
        <div className="px-6 py-5 space-y-4">
          <h2 className="font-serif text-lg text-center">Photo together</h2>

          {/* No one else here */}
          {!hasOthers && (
            <div className="text-center space-y-2">
              <p className="font-mono text-xs text-muted-foreground">No one else is in this event yet.</p>
              <p className="font-mono text-xs text-muted-foreground">Share the URL and wait for someone to join.</p>
            </div>
          )}

          {/* Idle — ready to go */}
          {hasOthers && stage === 'idle' && (
            <div className="flex flex-col items-center gap-3">
              <p className="font-mono text-xs text-muted-foreground text-center">
                {others.length === 1
                  ? `${others[0].presence.name} is here.`
                  : `${others.length} people are here.`}
              </p>
              <button
                onClick={handleReady}
                className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-sm hover:bg-accent/90 transition-colors"
              >
                I'm ready 📸
              </button>
            </div>
          )}

          {/* Waiting for other person to accept */}
          {stage === 'ready-sent' && (
            <div className="text-center space-y-1">
              <p className="font-mono text-sm">Waiting for the other person…</p>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Prompt — they hit ready first */}
          {stage === 'prompt' && promptFrom && (
            <div className="text-center space-y-4">
              <p className="font-mono text-sm">
                <span className="font-semibold">{promptFrom.name}</span> is ready. Are you?
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleAccept} className="px-5 py-2 rounded-lg bg-accent text-accent-foreground font-mono text-sm hover:bg-accent/90 transition-colors">
                  Yes, let's go!
                </button>
                <button onClick={handleDecline} className="px-5 py-2 rounded-lg border border-border font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Not yet
                </button>
              </div>
            </div>
          )}

          {/* Countdown — no controls, just watch */}
          {stage === 'countdown' && (
            <p className="font-mono text-sm text-center text-muted-foreground">
              Get ready… smile!
            </p>
          )}

          {/* Strip — placing on canvas */}
          {stage === 'strip' && (
            <div className="text-center space-y-2">
              <p className="font-mono text-sm">✦ Got it! Placing on canvas…</p>
              {(!myFrame || !theirFrame) && (
                <p className="font-mono text-xs text-muted-foreground">Waiting for the other frame…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
