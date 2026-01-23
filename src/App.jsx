import Header from './components/layout/Header.jsx'
import { useEffect, useState } from 'react'
import DashboardGrid from './components/layout/DashboardGrid.jsx'

function App() {
  const [dockingStatus, setDockingStatus] = useState('Offline')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const envWsUrl = import.meta.env.VITE_WS_DOCKING_URL
    const apiBase = import.meta.env.VITE_API_BASE_URL
    const fallbackBase = window.location.origin
    const rawBase = apiBase && apiBase.startsWith('http') ? apiBase : fallbackBase
    const wsBase = rawBase.replace(/^http/, 'ws')
    const wsUrl = envWsUrl || `${wsBase}/ws/docking`

    let socket = null
    let offlineTimer = null
    const markOfflineSoon = () => {
      if (offlineTimer) clearTimeout(offlineTimer)
      offlineTimer = setTimeout(() => {
        setDockingStatus('Offline')
      }, 8000)
    }

    socket = new WebSocket(wsUrl)
    socket.onopen = () => {
      setDockingStatus('Online')
      markOfflineSoon()
    }
    socket.onmessage = (event) => {
      if (offlineTimer) clearTimeout(offlineTimer)
      try {
        const data = JSON.parse(event.data)
        if (typeof data?.online === 'boolean') {
          setDockingStatus(data.online ? 'Online' : 'Offline')
          markOfflineSoon()
          return
        }
        const statusValue =
          typeof data === 'string'
            ? data
            : data?.status ?? data?.state ?? data?.docking
        if (typeof statusValue === 'string') {
          const normalized = statusValue.trim().toLowerCase()
          if (normalized === 'on' || normalized === 'online') {
            setDockingStatus('Online')
          } else if (
            normalized === 'off' ||
            normalized === 'offline' ||
            normalized === 'disconnect' ||
            normalized === 'disconnected'
          ) {
            setDockingStatus('Offline')
          } else {
            setDockingStatus(statusValue)
          }
          markOfflineSoon()
          return
        }
        if (typeof statusValue === 'boolean') {
          setDockingStatus(statusValue ? 'Online' : 'Offline')
          markOfflineSoon()
        }
      } catch (error) {
        setDockingStatus('Offline')
      }
    }
    socket.onerror = () => setDockingStatus('Offline')
    socket.onclose = () => setDockingStatus('Offline')

    return () => {
      if (offlineTimer) clearTimeout(offlineTimer)
      if (socket) socket.close()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header dockingStatus={dockingStatus} />
      <DashboardGrid />
    </div>
  )
}

export default App
