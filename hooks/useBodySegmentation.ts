'use client'

import { useEffect, useRef, useState } from 'react'
import type { ImageSegmenter } from '@mediapipe/tasks-vision'

// Pinned to the installed package version
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'

// Module-level singleton
let segmenterCache: Promise<ImageSegmenter> | null = null

async function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterCache) {
    segmenterCache = (async () => {
      const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      })
    })()

    segmenterCache.catch(() => {
      segmenterCache = null
    })
  }
  return segmenterCache
}

export function useBodySegmentation(enabled: boolean) {
  const segmenterRef = useRef<ImageSegmenter | null>(null)
  const [modelReady, setModelReady] = useState(false)
  const [modelFailed, setModelFailed] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    getSegmenter()
      .then((seg) => {
        if (cancelled) return
        segmenterRef.current = seg
        setModelReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[DayMark] Body segmentation unavailable:', err)
        setModelFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { segmenterRef, modelReady, modelFailed }
}
