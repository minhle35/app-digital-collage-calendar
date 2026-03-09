'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useBroadcastEvent, useEventListener, useSelf } from '@/lib/liveblocks'

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export function useWebRTC() {
  const self = useSelf()
  const broadcast = useBroadcastEvent()
  const myId = self?.connectionId ?? -1

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)

  // Get local camera/mic
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      return stream
    } catch {
      console.warn('Camera/mic access denied')
      return null
    }
  }, [])

  const createPeer = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    const remote = new MediaStream()
    pc.ontrack = (e) => { e.streams[0].getTracks().forEach((t) => remote.addTrack(t)); setRemoteStream(remote) }
    pc.onicecandidate = (e) => {
      if (e.candidate) broadcast({ type: 'WEBRTC_ICE', to: -1, from: myId, candidate: e.candidate.toJSON() })
    }
    pc.onconnectionstatechange = () => setIsConnected(pc.connectionState === 'connected')

    peerRef.current = pc
    return pc
  }, [broadcast, myId])

  // Initiate call to a new peer
  const callPeer = useCallback(async (targetId: number) => {
    const stream = localStream ?? await startLocalStream()
    if (!stream) return
    const pc = createPeer(stream)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    broadcast({ type: 'WEBRTC_OFFER', to: targetId, from: myId, sdp: offer.sdp! })
  }, [localStream, startLocalStream, createPeer, broadcast, myId])

  // Handle incoming signaling events
  useEventListener(async ({ event }) => {
    if (event.type === 'WEBRTC_OFFER' && event.to === myId) {
      const stream = localStream ?? await startLocalStream()
      if (!stream) return
      const pc = createPeer(stream)
      await pc.setRemoteDescription({ type: 'offer', sdp: event.sdp })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      broadcast({ type: 'WEBRTC_ANSWER', to: event.from, from: myId, sdp: answer.sdp! })
    }

    if (event.type === 'WEBRTC_ANSWER' && event.to === myId) {
      await peerRef.current?.setRemoteDescription({ type: 'answer', sdp: event.sdp })
    }

    if (event.type === 'WEBRTC_ICE' && event.to === myId) {
      await peerRef.current?.addIceCandidate(event.candidate)
    }
  })

  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled })
    setIsMuted((m) => !m)
  }, [localStream])

  const toggleCam = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled })
    setIsCamOff((c) => !c)
  }, [localStream])

  const hangUp = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    localStream?.getTracks().forEach((t) => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
    setIsConnected(false)
  }, [localStream])

  // Cleanup on unmount
  useEffect(() => () => { hangUp() }, [hangUp])

  return {
    localStream, remoteStream, isConnected,
    isMuted, isCamOff,
    startLocalStream, callPeer, hangUp,
    toggleMute, toggleCam,
    myId,
  }
}
