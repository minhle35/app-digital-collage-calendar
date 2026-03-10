'use client'

import { useEffect, useRef, useState } from 'react'
import { useOthers } from '@/lib/liveblocks'
import { useWebRTC } from '@/hooks/useWebRTC'
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WebcamTile() {
  const others = useOthers()
  const hasOthers = others.length > 0

  const {
    localStream, remoteStream, isConnected,
    isMuted, isCamOff,
    startLocalStream, callPeer, hangUp,
    toggleMute, toggleCam,
    myId,
  } = useWebRTC()

  const [dismissed, setDismissed] = useState(false)
  const [started, setStarted] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
  }, [localStream])
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

  // Auto-call first other when they join and we've already started
  useEffect(() => {
    if (started && !isConnected && others.length > 0) {
      const firstOther = others[0]
      // Only the lower connectionId initiates to avoid double-call
      if (myId < firstOther.connectionId) callPeer(firstOther.connectionId)
    }
  }, [started, isConnected, others, myId, callPeer])

  const handleStart = async () => {
    setStarted(true)
    await startLocalStream()
  }

  if (dismissed || !hasOthers) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {/* Dismiss */}
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden w-64">
        {!started ? (
          // Invite to join video
          <div className="p-4 flex flex-col items-center gap-3 text-center">
            <p className="font-serif text-sm">
              {others.length === 1 ? `${others[0].presence.name} is here` : `${others.length} people are here`}
            </p>
            <p className="font-mono text-xs text-muted-foreground">Enable camera to see each other</p>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-mono text-xs hover:bg-accent/90 transition-colors"
            >
              <Video className="w-4 h-4" />
              Join video
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Remote video — main */}
            <div className="relative bg-muted aspect-video">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="font-mono text-xs text-muted-foreground">
                    {isConnected ? 'No video' : 'Waiting for the other person…'}
                  </p>
                </div>
              )}

              {/* Local video — pip */}
              <div className="absolute bottom-2 right-2 w-16 aspect-video rounded-md overflow-hidden border border-border/60 shadow-md bg-muted">
                {localStream ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <VideoOff className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Connected indicator */}
              {isConnected && (
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-white/80">Live</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-border">
              <ControlBtn onClick={toggleMute} active={isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </ControlBtn>
              <ControlBtn onClick={toggleCam} active={isCamOff} title={isCamOff ? 'Turn on camera' : 'Turn off camera'}>
                {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </ControlBtn>
              <ControlBtn onClick={hangUp} title="Leave video" danger>
                <PhoneOff className="w-4 h-4" />
              </ControlBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ControlBtn({ children, onClick, title, active, danger }: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center transition-all',
        danger ? 'bg-red-500 text-white hover:bg-red-600'
          : active ? 'bg-foreground/20 text-foreground'
            : 'bg-secondary text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
