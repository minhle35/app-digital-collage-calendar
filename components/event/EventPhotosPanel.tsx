'use client'

import { useCallback } from 'react'
import { useStorage, useMutation } from '@/lib/liveblocks'
import { generateElementId, type PhotoElement } from '@/lib/types'
import type { SavedPhoto } from '@/lib/event-types'

const CANVAS_W = 820
const CANVAS_H = 620

function parsePhotos(raw: readonly string[]): SavedPhoto[] {
  return [...raw]
    .flatMap((s) => { try { return [JSON.parse(s) as SavedPhoto] } catch { return [] } })
    .sort((a, b) => b.addedAt - a.addedAt)
}

export function EventPhotosPanel() {
  const rawPhotos = useStorage((root) => root.photos)
  const photos = parsePhotos(rawPhotos ?? [])

  const savePhoto = useMutation(({ storage }, photo: SavedPhoto) => {
    const list = storage.get('photos')
    const exists = list.toArray().some((s) => { try { return JSON.parse(s).id === photo.id } catch { return false } })
    if (!exists) list.push(JSON.stringify(photo))
  }, [])

  const addToCanvas = useMutation(({ storage }, photo: SavedPhoto) => {
    const img = new window.Image()
    img.onload = () => {
      const w = 220
      const el: PhotoElement = {
        id: generateElementId(),
        type: 'photo',
        x: CANVAS_W * 0.1 + Math.random() * (CANVAS_W * 0.6),
        y: CANVAS_H * 0.1 + Math.random() * (CANVAS_H * 0.6),
        width: w,
        height: w / (img.width / img.height),
        rotation: (Math.random() - 0.5) * 4,
        zIndex: storage.get('elements').toArray().length,
        locked: false,
        src: photo.src,
        filter: 'none',
      }
      storage.get('elements').push(el)
    }
    img.src = photo.src
  }, [])

  const deleteFromLibrary = useMutation(({ storage }, id: string) => {
    const list = storage.get('photos')
    const idx = list.toArray().findIndex((s) => { try { return JSON.parse(s).id === id } catch { return false } })
    if (idx !== -1) list.delete(idx)
  }, [])

  // useMutation returns a stable ref — safe to call inside FileReader callbacks
  const handleUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => {
      Array.from(input.files ?? []).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const src = ev.target?.result as string
          const img = new window.Image()
          img.onload = () => {
            savePhoto({ id: generateElementId(), src, addedAt: Date.now() })
          }
          img.src = src
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }, [savePhoto])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: '#e8ddd0' }}
      >
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#b0a090' }}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={handleUpload}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-medium text-white transition-colors"
          style={{ backgroundColor: '#c8a874' }}
        >
          + Upload
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
            <span className="text-2xl">🖼️</span>
            <p className="font-mono text-[10px] text-center leading-relaxed" style={{ color: '#b0a090' }}>
              No photos yet.<br />Drag an image onto the canvas<br />or upload here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-lg overflow-hidden border aspect-square"
                style={{ borderColor: '#ede4d8' }}
              >
                <img
                  src={photo.src}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                >
                  <button
                    onClick={() => addToCanvas(photo)}
                    className="px-2.5 py-1 rounded-full font-mono text-[10px] font-medium text-white"
                    style={{ backgroundColor: '#c8a874' }}
                  >
                    + Canvas
                  </button>
                  <button
                    onClick={() => deleteFromLibrary(photo.id)}
                    className="font-mono text-[10px] text-white/70 hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
