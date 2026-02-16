import Header from './components/layout/Header.jsx'
import { useEffect, useRef, useState } from 'react'
import DashboardGrid from './components/layout/DashboardGrid.jsx'
import { useNotifications } from './contexts/NotificationContext.jsx'

function App() {
  const [dockingStatus, setDockingStatus] = useState('Offline')
  const lastWsErrorRef = useRef(0)
  const { pushNotification } = useNotifications()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const envWsUrl =
      import.meta.env.VITE_WS_TELEMETRY_URL ||
      import.meta.env.VITE_WS_DOCKING_URL
    const envDroneIds =
      import.meta.env.VITE_DRONE_IDS || import.meta.env.VITE_DRONE_ID || ''
    const droneIds = envDroneIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    const apiBase = import.meta.env.VITE_API_BASE_URL
    const fallbackBase = window.location.origin
    const rawBase = apiBase && apiBase.startsWith('http') ? apiBase : fallbackBase
    const wsBase = rawBase.replace(/^http/, 'ws')
    const wsUrl = envWsUrl || `${wsBase}/ws/telemetry`

    let socket = null
    let offlineTimer = null
    let reconnectTimer = null
    let reconnectAttempt = 0
    let isUnmounted = false
    const subscribeMessage = droneIds.length
      ? JSON.stringify({ type: 'subscribe', drones: droneIds })
      : null
    const markOfflineSoon = () => {
      if (offlineTimer) clearTimeout(offlineTimer)
      offlineTimer = setTimeout(() => {
        setDockingStatus('Offline')
      }, 8000)
    }
    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }
    const scheduleReconnect = () => {
      if (isUnmounted) return
      if (reconnectTimer) return
      const baseDelay = Math.min(1000 * 2 ** reconnectAttempt, 15000)
      const jitter = Math.floor(Math.random() * 500)
      const delay = baseDelay + jitter
      reconnectAttempt += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
      console.log('[telemetry-ws] reconnect in', delay, 'ms')
    }
    const connect = () => {
      if (isUnmounted) return
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return
      }
      socket = new WebSocket(wsUrl)
      socket.onopen = () => {
        reconnectAttempt = 0
        clearReconnectTimer()
        markOfflineSoon()
        if (subscribeMessage) {
          try {
            console.log('[telemetry-ws] subscribe', subscribeMessage)
            socket.send(subscribeMessage)
          } catch (error) {
            console.warn('[telemetry-ws] failed to subscribe', error)
          }
        }
      }
      socket.onmessage = (event) => {
        if (offlineTimer) clearTimeout(offlineTimer)
        try {
          const data = JSON.parse(event.data)
          markOfflineSoon()
          const metric =
            typeof data?.metric === 'string' ? data.metric.toLowerCase() : null
          if (
            metric === 'docking' &&
            typeof data?.payload?.online === 'boolean'
          ) {
            setDockingStatus(data.payload.online ? 'Online' : 'Offline')
            markOfflineSoon()
            return
          }
        } catch (error) {
          setDockingStatus('Offline')
        }
      }
      socket.onerror = () => {
        setDockingStatus('Offline')
        if (!isUnmounted) {
          lastWsErrorRef.current = Date.now()
          pushNotification(
            'Telemetry is unavailable right now. Retrying...',
            'error',
            'Telemetry',
          )
        }
        scheduleReconnect()
      }
      socket.onclose = () => {
        setDockingStatus('Offline')
        if (!isUnmounted) {
          const now = Date.now()
          if (now - lastWsErrorRef.current < 1000) {
            scheduleReconnect()
            return
          }
          pushNotification(
            'Telemetry connection lost. Reconnecting...',
            'warning',
            'Telemetry',
          )
        }
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      isUnmounted = true
      clearReconnectTimer()
      if (offlineTimer) clearTimeout(offlineTimer)
      if (socket) socket.close()
    }
  }, [pushNotification])

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header dockingStatus={dockingStatus} />
      <DashboardGrid />
    </div>
  )
}

export default App
