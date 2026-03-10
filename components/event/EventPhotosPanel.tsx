'use client'

import { useCallback } from 'react'
import { useStorage, useMutation, useOthers, useUpdateMyPresence } from '@/lib/liveblocks'
import { generateElementId, type PhotoElement } from '@/lib/types'
import { PHOTO_LIBRARY_LIMIT, type SavedPhoto } from '@/lib/event-types'
import { Trash2, Lock } from 'lucide-react'

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

  const others = useOthers()
  const updatePresence = useUpdateMyPresence()

  // Find another user currently holding the photo lock
  const lockHolder = others.find((o) => o.presence.photoLock != null) ?? null
  const isLocked = lockHolder !== null

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

  const handleDelete = useCallback((id: string) => {
    if (isLocked) return
    updatePresence({ photoLock: 'deleting' })
    deleteFromLibrary(id)
    updatePresence({ photoLock: null })
  }, [isLocked, updatePresence, deleteFromLibrary])

  const handleUpload = useCallback(() => {
    if (atLimit || isLocked) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => {
      const files = Array.from(input.files ?? []).slice(0, PHOTO_LIBRARY_LIMIT - photos.length)
      if (files.length === 0) return
      updatePresence({ photoLock: 'uploading' })
      let remaining = files.length
      const done = () => { if (--remaining === 0) updatePresence({ photoLock: null }) }
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const src = ev.target?.result as string
          const img = new window.Image()
          img.onload = () => { savePhoto({ id: generateElementId(), src, addedAt: Date.now() }); done() }
          img.onerror = done
          img.src = src
        }
        reader.onerror = done
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }, [atLimit, isLocked, photos.length, updatePresence, savePhoto])

  const lockAction = lockHolder?.presence.photoLock === 'uploading' ? 'uploading a photo' : 'deleting a photo'
  const lockName = lockHolder?.presence.name ?? 'Someone'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Lock warning banner */}
      {isLocked && (
        <div
          className="shrink-0 mx-3 mt-2.5 px-3 py-2 rounded-lg flex items-start gap-2 border"
          style={{ backgroundColor: '#fdf6e3', borderColor: '#e8c97a' }}
        >
          <Lock className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#a07820' }} />
          <p className="font-mono text-[10px] leading-relaxed" style={{ color: '#7a5810' }}>
            <span className="font-semibold">{lockName}</span> is {lockAction}.
            <br />Upload and delete are locked until they finish.
          </p>
        </div>
      )}

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
            disabled={atLimit || isLocked}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8a874' }}
            title={isLocked ? `${lockName} is ${lockAction} — please wait` : undefined}
          >
            + Upload
          </button>
        </div>

        {/* Limit warning */}
        {atLimit && !isLocked && (
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

                {/* Delete button — hidden when locked */}
                {!isLocked && (
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(180,40,40,0.85)' }}
                    title="Delete permanently"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-white" />
                  </button>
                )}

                {/* Lock indicator overlay when locked */}
                {isLocked && (
                  <div className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(160,120,32,0.75)' }}
                    title={`${lockName} is ${lockAction}`}
                  >
                    <Lock className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Hover overlay — add to canvas (always available) */}
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
