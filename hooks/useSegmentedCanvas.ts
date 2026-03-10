'use client'

import { useEffect, useRef } from 'react'
import type { ImageSegmenter } from '@mediapipe/tasks-vision'

const TARGET_FPS = 24
const FRAME_INTERVAL = 1000 / TARGET_FPS

/**
 * Runs a requestAnimationFrame loop that draws background-removed video
 * frames onto a canvas using MediaPipe confidence masks.
 *
 * Canvas content is in natural (un-mirrored) orientation.
 * Apply CSS `scale-x-[-1]` on the canvas element for a mirror selfie display.
 */
export function useSegmentedCanvas(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  segmenterRef: React.RefObject<ImageSegmenter | null>,
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

    const drawRaw = (video: HTMLVideoElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    const loop = (now: number) => {
      if (!running) return
      rafRef.current = requestAnimationFrame(loop)

      if (now - lastTime < FRAME_INTERVAL) return
      lastTime = now

      const video = videoRef.current
      if (!video || video.readyState < 2) return

      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
      }

      const segmenter = segmenterRef.current
      if (!segmenter) {
        drawRaw(video)
        return
      }

      try {
        const result = segmenter.segmentForVideo(video, now)
        const confidenceMask = result.confidenceMasks?.[0]

        if (confidenceMask) {
          // Draw raw video frame first
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Read pixels + mask, then zero out background alpha
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const pixels = imageData.data
          const maskData = confidenceMask.getAsFloat32Array()

          for (let i = 0; i < maskData.length; i++) {
            // maskData[i]: 0 = background, 1 = person
            pixels[i * 4 + 3] = Math.round(maskData[i] * 255)
          }

          ctx.putImageData(imageData, 0, 0)
          result.close()
        } else {
          drawRaw(video)
          result.close()
        }
      } catch {
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
