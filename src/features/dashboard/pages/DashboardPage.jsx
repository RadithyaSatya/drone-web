import { useEffect, useRef, useState } from 'react'
import Header from '../../../shared/components/AppHeader.jsx'
import DashboardGrid from '../layout/DashboardGrid.jsx'
import { useNotifications } from '../../../shared/contexts/NotificationContext.jsx'
import {
  notifyServerError,
  notifyServerRecovery,
} from '../../../shared/services/serverStatus.js'
import { useAuth } from '../../auth/context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const API_ROOT = API_BASE.replace(/\/$/, '')

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

const buildWsUrl = (envWsUrl, rawBase) => {
  if (envWsUrl) {
    const resolved = new URL(envWsUrl, rawBase)
    if (resolved.protocol.startsWith('http')) {
      resolved.protocol = resolved.protocol.replace('http', 'ws')
    }
    return resolved.toString()
  }
  const wsBase = rawBase.replace(/^http/, 'ws')
  return `${wsBase}/ws/telemetry`
}

const addTokenToWsUrl = (wsUrl, token) => {
  if (!token) return wsUrl
  try {
    const url = new URL(wsUrl, window.location.origin)
    url.searchParams.set('token', token)
    return url.toString()
  } catch (error) {
    const separator = wsUrl.includes('?') ? '&' : '?'
    return `${wsUrl}${separator}token=${encodeURIComponent(token)}`
  }
}

function DashboardPage() {
  const [dockingStatus, setDockingStatus] = useState('Offline')
  const lastWsErrorRef = useRef(0)
  const { pushNotification } = useNotifications()
  const { token, logout } = useAuth()

  const handleLogout = () => {
    logout()
    pushNotification('You have signed out.', 'info', 'Auth')
  }

  useEffect(() => {
    if (!token) return undefined
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
    const fallbackBase = window.location.origin
    const rawBase = (
      API_BASE && API_BASE.startsWith('http') ? API_BASE : fallbackBase
    ).replace(/\/$/, '')
    const wsUrl = buildWsUrl(envWsUrl, rawBase)

    let socket = null
    let offlineTimer = null
    let reconnectTimer = null
    let reconnectAttempt = 0
    let isUnmounted = false
    let wsToken = null
    let wsTokenExpiresAt = 0
    let wsTokenPromise = null
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
    const requestWsToken = async () => {
      const wsTokenUrl = `${API_ROOT}/auth/ws-token`
      let response
      try {
        response = await fetch(wsTokenUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        if (error?.name !== 'AbortError') {
          notifyServerError({
            message: 'Connection issue. Please try again shortly.',
            url: wsTokenUrl,
          })
        }
        throw error
      }

      const data = await parseResponse(response)
      if (!response.ok) {
        if (response.status >= 500) {
          notifyServerError({
            status: response.status,
            message: 'Service is experiencing issues. Please try again shortly.',
            url: wsTokenUrl,
          })
        }
        const error = new Error(
          data?.message || 'Failed to get WS token.',
        )
        error.status = response.status
        throw error
      }
      notifyServerRecovery()
      const nextToken = data?.token
      const expiresIn = Number(data?.expires_in ?? 0)
      if (!nextToken) {
        const error = new Error('WS token not found in response.')
        error.status = response.status
        throw error
      }
      wsToken = nextToken
      wsTokenExpiresAt =
        Date.now() + (Number.isFinite(expiresIn) ? expiresIn * 1000 : 0)
      return nextToken
    }
    const ensureWsToken = async () => {
      const bufferMs = 15000
      if (wsToken && Date.now() < wsTokenExpiresAt - bufferMs) {
        return wsToken
      }
      if (wsTokenPromise) return wsTokenPromise
      wsTokenPromise = requestWsToken()
      try {
        return await wsTokenPromise
      } finally {
        wsTokenPromise = null
      }
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
      const openSocket = async () => {
        let wsTokenValue = null
        try {
          wsTokenValue = await ensureWsToken()
        } catch (error) {
          if (!isUnmounted) {
            if (error?.status === 401 || error?.status === 403) {
              logout()
              pushNotification(
                'Your session has expired. Please log in again.',
                'error',
                'Auth',
              )
              return
            }
            pushNotification(
              'Failed to get WS token. Retrying...',
              'error',
              'Auth',
            )
          }
          scheduleReconnect()
          return
        }
        socket = new WebSocket(addTokenToWsUrl(wsUrl, wsTokenValue))
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
            console.log('[telemetry-ws] message', event.data)
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
      openSocket()
    }

    connect()

    return () => {
      isUnmounted = true
      clearReconnectTimer()
      if (offlineTimer) clearTimeout(offlineTimer)
      if (socket) socket.close()
    }
  }, [logout, pushNotification, token])

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header dockingStatus={dockingStatus} onLogout={handleLogout} />
      <DashboardGrid />
    </div>
  )
}

export default DashboardPage
