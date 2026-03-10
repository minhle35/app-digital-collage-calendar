'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useBroadcastEvent, useEventListener, useSelf } from '@/lib/liveblocks'

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export function useWebRTC() {
  const self = useSelf()
  const broadcast = useBroadcastEvent()
  const myId = self?.connectionId ?? -1

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const remotePeerIdRef = useRef<number | null>(null) // track who we're connected to for ICE routing
  const localStreamRef = useRef<MediaStream | null>(null)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)

  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch {
      console.warn('Camera/mic access denied')
      return null
    }
  }, [])

  const createPeer = useCallback((stream: MediaStream, targetId: number) => {
    // Close any existing connection before creating a new one
    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)
    remotePeerIdRef.current = targetId
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    const remote = new MediaStream()
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remote.addTrack(t))
      setRemoteStream(remote)
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && remotePeerIdRef.current !== null) {
        broadcast({ type: 'WEBRTC_ICE', to: remotePeerIdRef.current, from: myId, candidate: e.candidate.toJSON() })
      }
    }
    pc.onconnectionstatechange = () => setIsConnected(pc.connectionState === 'connected')

    peerRef.current = pc
    return pc
  }, [broadcast, myId])

  const callPeer = useCallback(async (targetId: number) => {
    // Guard: don't call if already connected or connecting to this peer
    if (remotePeerIdRef.current === targetId && peerRef.current?.signalingState !== 'closed') return

    const stream = await startLocalStream()
    if (!stream) return

    const pc = createPeer(stream, targetId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    broadcast({ type: 'WEBRTC_OFFER', to: targetId, from: myId, sdp: offer.sdp! })
  }, [startLocalStream, createPeer, broadcast, myId])

  useEventListener(async ({ event }) => {
    if (event.type === 'WEBRTC_OFFER' && event.to === myId) {
      const stream = await startLocalStream()
      if (!stream) return
      const pc = createPeer(stream, event.from)
      await pc.setRemoteDescription({ type: 'offer', sdp: event.sdp })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      broadcast({ type: 'WEBRTC_ANSWER', to: event.from, from: myId, sdp: answer.sdp! })
    }

    if (event.type === 'WEBRTC_ANSWER' && event.to === myId) {
      const pc = peerRef.current
      // Only apply answer if we're actually waiting for one
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription({ type: 'answer', sdp: event.sdp })
      }
    }

    if (event.type === 'WEBRTC_ICE' && event.to === myId) {
      try {
        await peerRef.current?.addIceCandidate(event.candidate)
      } catch {
        // Ignore ICE errors if connection is already closed
      }
    }
  })

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled })
    setIsMuted((m) => !m)
  }, [])

  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled })
    setIsCamOff((c) => !c)
  }, [])

  const hangUp = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    remotePeerIdRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setIsConnected(false)
  }, [])

  useEffect(() => () => { hangUp() }, [hangUp])

  return {
    localStream, remoteStream, isConnected,
    isMuted, isCamOff,
    startLocalStream, callPeer, hangUp,
    toggleMute, toggleCam,
    myId,
  }
}
