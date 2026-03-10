'use client'

import { useEffect, useRef, useState } from 'react'
import type { BodySegmenter } from '@tensorflow-models/body-segmentation'

// Module-level singleton — shared across all hook instances
let segmenterCache: Promise<BodySegmenter> | null = null

async function getSegmenter(): Promise<BodySegmenter> {
  if (!segmenterCache) {
    segmenterCache = (async () => {
      const tf = await import('@tensorflow/tfjs-core')
      await import('@tensorflow/tfjs-backend-webgl')
      await tf.setBackend('webgl')
      await tf.ready()

      const bodySegmentation = await import('@tensorflow-models/body-segmentation')
      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation
      return bodySegmentation.createSegmenter(model, {
        runtime: 'tfjs',
        modelType: 'general',
      })
    })()

    // Reset cache on failure so the next attempt can retry
    segmenterCache.catch(() => {
      segmenterCache = null
    })
  }
  return segmenterCache
}

/**
 * Lazily loads the MediaPipe Selfie Segmentation model via TF.js WebGL backend.
 * Returns a ref to the segmenter (null until ready) plus ready/failed flags.
 */
export function useBodySegmentation(enabled: boolean) {
  const segmenterRef = useRef<BodySegmenter | null>(null)
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
