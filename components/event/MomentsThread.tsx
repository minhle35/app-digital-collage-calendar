'use client'

import { useState, useRef, useEffect } from 'react'
import { useStorage, useMutation, useSelf } from '@/lib/liveblocks'
import type { ThreadComment } from '@/lib/event-types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const QUICK_REACTIONS = ['✨', '❤️', '🔥', '😊', '🎉']

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

// Simple deterministic color from name
function avatarColor(name: string) {
  const colors = ['#c8a874', '#7b8db8', '#6b9e78', '#c4726a', '#9b7bb8', '#5fa8a0']
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return colors[Math.abs(hash) % colors.length]
}

interface CommentRowProps {
  comment: ThreadComment
  onReact: (id: string, emoji: string) => void
}

function CommentRow({ comment, onReact }: CommentRowProps) {
  const reactions: Record<string, number> = (() => {
    try { return JSON.parse(comment.reactions || '{}') } catch { return {} }
  })()

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-white mt-0.5"
        style={{ backgroundColor: avatarColor(comment.authorName) }}
      >
        {initials(comment.authorName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-mono text-[11px] font-semibold" style={{ color: '#3a3028' }}>
            {comment.authorName}
          </span>
          <span className="font-mono text-[10px]" style={{ color: '#b0a090' }}>
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="font-mono text-xs leading-relaxed" style={{ color: '#4a3c30' }}>
          {comment.text}
        </p>

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => onReact(comment.id, emoji)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-mono transition-colors hover:opacity-80"
              style={{ borderColor: '#e8ddd0', backgroundColor: '#faf6f0', color: '#6b5e4e' }}
            >
              {emoji} <span>{count}</span>
            </button>
          ))}

          {/* Quick reaction picker (shows on hover) */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(comment.id, emoji)}
                className="text-sm hover:scale-125 transition-transform"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MomentsThread() {
  const comments = useStorage((root) => root.comments)
  const self = useSelf()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const addComment = useMutation(({ storage }, commentText: string) => {
    const comment: ThreadComment = {
      id: generateId(),
      text: commentText,
      authorName: self?.presence.name ?? 'Guest',
      createdAt: Date.now(),
      reactions: '{}',
    }
    storage.get('comments').push(comment)
  }, [self])

  const reactToComment = useMutation(({ storage }, id: string, emoji: string) => {
    const list = storage.get('comments')
    const idx = list.toArray().findIndex((c) => c.id === id)
    if (idx === -1) return
    const comment = list.get(idx)
    const reactions: Record<string, number> = (() => {
      try { return JSON.parse(comment.reactions || '{}') } catch { return {} }
    })()
    reactions[emoji] = (reactions[emoji] ?? 0) + 1
    list.set(idx, { ...comment, reactions: JSON.stringify(reactions) })
  }, [])

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments?.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addComment(text.trim())
    setText('')
  }

  return (
    <section
      className="border-t px-6 py-4 flex flex-col"
      style={{ borderColor: '#e8ddd0', backgroundColor: '#fdf9f4', minHeight: 220, maxHeight: 360 }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <span className="font-mono text-xs font-semibold tracking-widest uppercase" style={{ color: '#c8a874' }}>
          Moments Thread
        </span>
        {comments && comments.length > 0 && (
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: '#f0e8d8', color: '#8a7a6a' }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {!comments || comments.length === 0 ? (
          <p className="font-mono text-xs text-center py-4" style={{ color: '#b0a090' }}>
            Be the first to share a moment ✨
          </p>
        ) : (
          comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} onReact={reactToComment} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a moment…"
          className="flex-1 font-mono text-xs rounded-full border px-3.5 py-2 focus:outline-none focus:ring-1"
          style={{
            borderColor: '#e0d4c0',
            backgroundColor: '#fff',
            color: '#3a3028',
            focusRingColor: '#c8a874',
          }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 rounded-full font-mono text-xs font-medium text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: '#c8a874' }}
        >
          Send
        </button>
      </form>
    </section>
  )
}
