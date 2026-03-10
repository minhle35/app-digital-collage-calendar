'use client'

import { useCallback } from 'react'
import { useStorage, useMutation } from '@/lib/liveblocks'
import { generateElementId, type PhotoElement } from '@/lib/types'
import { PHOTO_LIBRARY_LIMIT, type SavedPhoto } from '@/lib/event-types'
import { Trash2 } from 'lucide-react'

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
  const atLimit = photos.length >= PHOTO_LIBRARY_LIMIT

  const savePhoto = useMutation(({ storage }, photo: SavedPhoto) => {
    const list = storage.get('photos')
    if (list.toArray().length >= PHOTO_LIBRARY_LIMIT) return
    const exists = list.toArray().some((s) => { try { return JSON.parse(s).id === photo.id } catch { return false } })
    if (!exists) list.push(JSON.stringify(photo))
  }, [])

  const addToCanvasMutation = useMutation(({ storage }, src: string, width: number, height: number) => {
    const el: PhotoElement = {
      id: generateElementId(),
      type: 'photo',
      x: CANVAS_W * 0.1 + Math.random() * (CANVAS_W * 0.6),
      y: CANVAS_H * 0.1 + Math.random() * (CANVAS_H * 0.6),
      width,
      height,
      rotation: (Math.random() - 0.5) * 4,
      zIndex: storage.get('elements').toArray().length,
      locked: false,
      src,
      filter: 'none',
    }
    storage.get('elements').push(el)
  }, [])

  const addToCanvas = useCallback((photo: SavedPhoto) => {
    const img = new window.Image()
    img.onload = () => {
      const w = 220
      addToCanvasMutation(photo.src, w, w / (img.width / img.height))
    }
    img.src = photo.src
  }, [addToCanvasMutation])

  const deleteFromLibrary = useMutation(({ storage }, id: string) => {
    const list = storage.get('photos')
    const idx = list.toArray().findIndex((s) => { try { return JSON.parse(s).id === id } catch { return false } })
    if (idx !== -1) list.delete(idx)
  }, [])

  const handleUpload = useCallback(() => {
    if (atLimit) return
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
  }, [atLimit, savePhoto])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 px-3 py-2.5 border-b space-y-2"
        style={{ borderColor: '#e8ddd0' }}
      >
        {/* Counter + upload */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px]" style={{ color: atLimit ? '#c05050' : '#b0a090' }}>
              {photos.length}/{PHOTO_LIBRARY_LIMIT} photos
            </span>
            {/* Slot indicators */}
            <div className="flex gap-0.5">
              {Array.from({ length: PHOTO_LIBRARY_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: i < photos.length ? (atLimit ? '#c05050' : '#c8a874') : '#ddd4c0' }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={atLimit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8a874' }}
          >
            + Upload
          </button>
        </div>

        {/* Limit warning */}
        {atLimit && (
          <p className="font-mono text-[9px] leading-relaxed" style={{ color: '#c05050' }}>
            Limit reached. Delete a photo permanently to free a slot.
          </p>
        )}
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
                className="group relative rounded-lg overflow-hidden border"
                style={{ borderColor: '#ede4d8', aspectRatio: '1' }}
              >
                <img
                  src={photo.src}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Always-visible delete button */}
                <button
                  onClick={() => deleteFromLibrary(photo.id)}
                  className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(180,40,40,0.85)' }}
                  title="Delete permanently"
                >
                  <Trash2 className="w-2.5 h-2.5 text-white" />
                </button>

                {/* Hover overlay — add to canvas */}
                <div
                  className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 40%, transparent)' }}
                >
                  <button
                    onClick={() => addToCanvas(photo)}
                    className="px-2.5 py-1 rounded-full font-mono text-[10px] font-medium text-white"
                    style={{ backgroundColor: '#c8a874' }}
                  >
                    + Canvas
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
