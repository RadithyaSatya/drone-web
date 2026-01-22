import { useEffect, useRef, useState } from 'react'
import Panel from '../ui/Panel.jsx'
import MaximizeButton from '../ui/MaximizeButton.jsx'

function CctvPanel({
  className,
  isMaximized = false,
  onToggleMaximize = () => {},
}) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('Idle')
  const [error, setError] = useState('')

  useEffect(() => {
    const whepUrl = import.meta.env.VITE_CCTV_WHEP_URL
    if (!whepUrl) {
      setStatus('No URL')
      return
    }

    let isActive = true
    let pc = null
    const abortController = new AbortController()

    const waitForIceGathering = () =>
      new Promise((resolve) => {
        if (!pc) {
          resolve()
          return
        }
        if (pc.iceGatheringState === 'complete') {
          resolve()
          return
        }
        const handleStateChange = () => {
          if (pc && pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', handleStateChange)
            resolve()
          }
        }
        pc.addEventListener('icegatheringstatechange', handleStateChange)
      })

    const connect = async () => {
      try {
        setStatus('Connecting')
        setError('')

        pc = new RTCPeerConnection()
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })

        pc.ontrack = (event) => {
          if (!isActive || !videoRef.current) return
          const [stream] = event.streams
          if (stream) {
            videoRef.current.srcObject = stream
          }
        }

        pc.onconnectionstatechange = () => {
          if (!isActive) return
          if (pc.connectionState === 'connected') {
            setStatus('Live')
          } else if (pc.connectionState === 'failed') {
            setStatus('Error')
          }
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await waitForIceGathering()

        const response = await fetch(whepUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: pc.localDescription?.sdp || offer.sdp,
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`WHEP failed: ${response.status}`)
        }

        const answerSdp = await response.text()
        if (!isActive) return
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      } catch (err) {
        if (!isActive) return
        setStatus('Error')
        setError(err instanceof Error ? err.message : 'Failed to connect')
      }
    }

    connect()

    return () => {
      isActive = false
      abortController.abort()
      if (pc) {
        pc.close()
        pc = null
      }
    }
  }, [])

  return (
    <Panel
      title="CCTV Stream"
      titleId="panel-cctv"
      className={className}
      actions={
        <MaximizeButton
          isMaximized={isMaximized}
          onToggle={onToggleMaximize}
          label="cctv"
        />
      }
    >
      <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950 min-[900px]:min-h-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
          <span>CCTV Stream</span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200">
            {status}
          </span>
        </div>
        {!import.meta.env.VITE_CCTV_WHEP_URL ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Set VITE_CCTV_WHEP_URL
          </div>
        ) : null}
        {error ? (
          <div className="absolute bottom-3 left-3 right-3 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

export default CctvPanel
