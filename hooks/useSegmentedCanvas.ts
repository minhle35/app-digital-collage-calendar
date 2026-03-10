'use client'

import { useEffect, useRef } from 'react'
import type { BodySegmenter } from '@tensorflow-models/body-segmentation'

const TARGET_FPS = 24
const FRAME_INTERVAL = 1000 / TARGET_FPS

/**
 * Runs a requestAnimationFrame loop that draws segmented (background-removed)
 * video frames onto a canvas. Falls back to raw video if the segmenter is
 * not yet ready or segmentation fails.
 *
 * The canvas content is always in natural (un-mirrored) orientation.
 * Apply CSS `scale-x-[-1]` to the canvas element for a mirror display.
 */
export function useSegmentedCanvas(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  segmenterRef: React.RefObject<BodySegmenter | null>,
  enabled: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = 0
    let running = true

    // Cache the toBinaryMask import — loaded once, reused every frame
    let toBinaryMask: typeof import('@tensorflow-models/body-segmentation')['toBinaryMask'] | null = null
    import('@tensorflow-models/body-segmentation').then((mod) => {
      toBinaryMask = mod.toBinaryMask
    })

    const drawRaw = (video: HTMLVideoElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    const loop = async (now: number) => {
      if (!running) return
      rafRef.current = requestAnimationFrame(loop)

      if (now - lastTime < FRAME_INTERVAL) return
      lastTime = now

      const video = videoRef.current
      if (!video || video.readyState < 2) return

      // Keep canvas dimensions in sync with the video feed
      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
      }

      const segmenter = segmenterRef.current
      if (!segmenter || !toBinaryMask) {
        drawRaw(video)
        return
      }

      try {
        const segmentation = await segmenter.segmentPeople(video, {
          multiSegmentation: false,
          segmentBodyParts: false,
        })

        // Draw the raw video frame first
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        if (segmentation.length > 0) {
          // Build a binary mask:
          //   foreground (person) → alpha 0   (keep these pixels)
          //   background          → alpha 255 (erase these pixels)
          const maskData = await toBinaryMask(
            segmentation,
            { r: 0, g: 0, b: 0, a: 0 },    // foreground: transparent → keep
            { r: 0, g: 0, b: 0, a: 255 },   // background: opaque     → erase
            false,
            0.5,
          )

          // Render mask to a temp canvas then composite with destination-out
          const maskCanvas = document.createElement('canvas')
          maskCanvas.width = canvas.width
          maskCanvas.height = canvas.height
          maskCanvas.getContext('2d')!.putImageData(maskData, 0, 0)

          ctx.globalCompositeOperation = 'destination-out'
          ctx.drawImage(maskCanvas, 0, 0)
          ctx.globalCompositeOperation = 'source-over'
        }
      } catch {
        // Segmentation error on this frame — fall back to raw video
        drawRaw(video)
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, videoRef, segmenterRef])

  return canvasRef
}
