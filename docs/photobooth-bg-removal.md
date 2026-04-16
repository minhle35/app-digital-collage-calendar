# Photo Booth — Background Removal Feature

## Overview

The collaborative photo booth allows two users in the same Liveblocks event room to take a photo "together" despite being in different physical locations. Each person's webcam background is removed in real time using MediaPipe, and both cutouts are composited onto a shared decorative backdrop before being placed on the shared canvas.

---

## Architecture

### Flow diagram

```
User A opens PhotoBoothOverlay
  │
  ├─► Camera stream → hidden <video> element
  │
  ├─► useBodySegmentation()
  │     └─► Lazy loads @mediapipe/tasks-vision (WASM from CDN)
  │         └─► ImageSegmenter in VIDEO mode
  │
  ├─► useSegmentedCanvas(videoRef, segmenterRef)
  │     └─► requestAnimationFrame loop
  │           ├─► segmenter.segmentForVideo(video, timestamp)
  │           ├─► confidence mask → modify pixel alpha
  │           └─► putImageData → canvas shows person with transparent bg
  │
  └─► <canvas> element
        ├─► CSS `background: <backdrop>` shows scene under transparent pixels
        └─► CSS `scale-x-[-1]` mirrors for natural selfie feel

Both users hit "I'm ready" → Liveblocks broadcast:
  PHOTO_READY → PHOTO_ACCEPTED → COUNTDOWN_START
  → countdown = 0 → captureFrame() from segmented canvas (PNG with alpha)
  → broadcast PHOTO_FRAME { dataUrl: "data:image/png;base64,..." }

Initiator receives both frames:
  stitchWithBackdrop(frameA, frameB, backdrop)
    ├─► Create canvas, fill with backdrop.render()
    ├─► drawImage(frameA) — transparent cutout, person visible
    ├─► drawImage(frameB) — transparent cutout, person visible
    └─► toDataURL('image/png') → addMutation → Liveblocks storage
```

### Files

| File | Role |
|------|------|
| `hooks/useBodySegmentation.ts` | Singleton loader for MediaPipe `ImageSegmenter`. Lazy-loads WASM + model from CDN. Returns a `segmenterRef` (stable ref, not state) plus `modelReady` / `modelFailed` flags. |
| `hooks/useSegmentedCanvas.ts` | RAF loop that reads each video frame, calls `segmentForVideo`, applies the confidence mask to pixel alpha values, and writes the result to a canvas. Falls back to raw video if model is not yet ready. |
| `lib/booth-backdrops.ts` | Defines `BackdropPreset` type and 5 scene presets (Polaroid, Milk Tea, Sakura, Garden, Night). Each preset has a `preview` CSS string (for live canvas background) and a `render()` function (for the final canvas stitch). |
| `components/event/PhotoBoothOverlay.tsx` | Main overlay component. Manages booth stage machine, Liveblocks broadcast/receive, countdown, capture, stitch, and placement. Wires the two hooks and renders the scene picker UI. |

### Key design decisions

**Why `segmenterRef` instead of `segmenter` state?**
React state triggers re-renders. A ref update does not. The RAF loop already checks `segmenterRef.current` on every tick, so when the model loads, the very next frame picks it up with no re-render needed.

**Why is the `<video>` element visually hidden but not `display:none`?**
`display:none` (Tailwind `hidden`) tells the browser it does not need to decode the video. The video's `readyState` never advances past 0, so the RAF loop always exits early with a blank canvas. Instead, the video is hidden using `opacity-0 w-0 h-0` — it is still rendered and decoded in the background.

**Why canvas `background` CSS instead of drawing the backdrop per frame?**
The segmented canvas pixels are fully transparent where the background was removed. CSS `background` on the canvas element shows through these transparent pixels automatically, without any per-frame canvas drawing. This means the backdrop picker updates instantly with no code change to the loop.

**Why PNG (not JPEG) for `PHOTO_FRAME` broadcast?**
JPEG does not support an alpha channel. The cutout frames must be PNG to preserve transparency so the initiator can composite them correctly over the backdrop.

**Why `@mediapipe/tasks-vision` instead of `@tensorflow-models/body-segmentation`?**
See the Troubleshooting section below.

---

## Troubleshooting history

### Issue 1 — `SelfieSegmentation` not found in `@mediapipe/selfie_segmentation`

**Error:**
```
Export SelfieSegmentation doesn't exist in target module
./node_modules/@mediapipe/selfie_segmentation/selfie_segmentation.js
```

**Root cause:**
`@tensorflow-models/body-segmentation` does a static top-level `import { SelfieSegmentation } from "@mediapipe/selfie_segmentation"` even when `runtime: 'tfjs'` is chosen. The installed `@mediapipe/selfie_segmentation` package ships only CJS/UMD — Next.js 16 (Turbopack) could not find the named ESM export.

**Attempted fix:**
Created `lib/mediapipe-stub.js` — a stub exporting a no-op `SelfieSegmentation` class, and aliased the package to it via `turbopack.resolveAlias` in `next.config.mjs`. The build error was resolved but TF.js model loading still failed (see Issue 2).

---

### Issue 2 — TF.js dynamic imports never resolve under Turbopack

**Symptom:**
"Loading background removal…" badge shown indefinitely. `modelReady` never became `true`, `modelFailed` never became `true`. The model promise silently hung.

**Root cause:**
`@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`, and `@tensorflow-models/body-segmentation` are complex CJS/ESM hybrid modules. Turbopack (Next.js 16 default bundler) does not fully support their dynamic import + side-effect registration pattern (the WebGL backend registers itself via a side effect import). The dynamic `await import(...)` calls resolved to incomplete module objects, preventing `tf.setBackend('webgl')` from finding the registered backend.

**Fix:**
Replaced the entire TF.js stack with `@mediapipe/tasks-vision` (Google's official modern MediaPipe for web). Key differences:

| | `@tensorflow-models/body-segmentation` | `@mediapipe/tasks-vision` |
|---|---|---|
| Runtime | TF.js WebGL backend | Native WASM + WebGL via CDN |
| Bundler support | Poor (CJS/ESM hybrid issues) | Excellent (designed for npm) |
| Dynamic import | Async, complex backend registration | Single `import()` call |
| Inference API | Async `segmentPeople()` | Synchronous `segmentForVideo()` |
| RAF loop impact | `async/await` in loop | No await — runs synchronously |

---

### Issue 3 — Canvas showing blank (no video feed)

**Symptom:**
Even while the model was loading (fallback mode), the canvas was black/blank instead of showing the raw video feed.

**Root cause:**
The `<video>` element had Tailwind's `hidden` class (`display: none`). This prevented the browser from rendering and decoding the video. `video.readyState` stayed at 0, so every RAF loop iteration hit the early-exit guard `if (video.readyState < 2) return`, producing a permanently blank canvas.

**Fix:**
Replaced `className="hidden"` with `className="absolute opacity-0 pointer-events-none w-0 h-0"`. The video is now invisible but still rendered and decoded by the browser.

---

## Vercel deployment — known issues and mitigations

### 1. CDN dependency for WASM and model files

The MediaPipe WASM runtime and `.tflite` model file are fetched from external CDNs at runtime:

- **WASM**: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm`
- **Model**: `https://storage.googleapis.com/mediapipe-models/...`

**Risk:** If either CDN is down or rate-limited, the model will fail to load and the booth silently degrades to raw video (acceptable fallback).

**Mitigation (recommended for production):**
Copy the WASM files and model to your Vercel project's `public/` directory and update the paths in `useBodySegmentation.ts`:

```bash
# Copy WASM files from node_modules to public
cp -r node_modules/@mediapipe/tasks-vision/wasm public/mediapipe-wasm
```

```typescript
// useBodySegmentation.ts
const WASM_CDN = '/mediapipe-wasm'  // served from your own domain
```

For the model `.tflite` file, download it once and place it in `public/models/selfie_segmenter.tflite`.

### 2. Content Security Policy (CSP) headers

If you add CSP headers on Vercel (recommended), you must allow:
- `connect-src cdn.jsdelivr.net storage.googleapis.com` — for CDN fetches
- `worker-src blob:` — MediaPipe WASM uses blob URLs for workers
- `script-src blob: 'wasm-unsafe-eval'` — WASM execution requires this

Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "script-src 'self' 'wasm-unsafe-eval' blob:; worker-src blob:; connect-src 'self' cdn.jsdelivr.net storage.googleapis.com wss://liveblocks.io"
        }
      ]
    }
  ]
}
```

### 3. SharedArrayBuffer / cross-origin isolation

MediaPipe WASM may require `SharedArrayBuffer` in some configurations. This requires cross-origin isolation headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Important:** These headers break Liveblocks WebSocket connections and many third-party scripts unless those resources include `Cross-Origin-Resource-Policy: cross-origin`. Test carefully before enabling. In practice, `@mediapipe/tasks-vision` works without these headers for most use cases.

### 4. Large payload on first photo booth open

The first time a user opens the photo booth, the browser downloads:
- WASM runtime: ~2.5 MB
- `.tflite` model: ~1 MB

These are cached by the browser after the first load (CDN sets long-lived cache headers). Subsequent opens are instant.

**Mitigation:** Preload the assets when the event page loads, not when the photo booth opens:

```typescript
// In EventPage.tsx, add a useEffect to kick off model loading early
useEffect(() => {
  // Warm up the segmenter in the background
  import('@/hooks/useBodySegmentation').then(({ getSegmenter }) => getSegmenter().catch(() => {}))
}, [])
```

### 5. `@mediapipe/tasks-vision` package size on server bundle

`@mediapipe/tasks-vision` is a client-only package. It should not be included in the server bundle. Since all usage is inside `'use client'` components and hooks, Next.js should correctly tree-shake it from the server bundle. Verify with:

```bash
pnpm build
# Check .next/server/ for any unexpected large files
```

If the package ends up in the server bundle, add it to `serverExternalPackages` in `next.config.mjs`:

```js
serverExternalPackages: ['@mediapipe/tasks-vision']
```

### 6. Liveblocks `PHOTO_FRAME` payload size

Each captured PNG with a transparent background is broadcast via Liveblocks as a base64 data URL. At 640×480, this is typically 100–300 KB encoded. Liveblocks has a message size limit of **1 MB** per event.

**Risk:** On high-resolution cameras (1920×1080), the PNG could exceed 1 MB.

**Mitigation:** Cap the video capture resolution in `getUserMedia`:

```typescript
navigator.mediaDevices.getUserMedia({
  video: { width: { max: 640 }, height: { max: 480 } },
  audio: false,
})
```

This is already the effective resolution since MediaPipe works best at 640×480 anyway.
