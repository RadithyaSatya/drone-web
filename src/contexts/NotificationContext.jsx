import { createContext, useCallback, useContext, useRef, useState } from 'react'
import NotificationStack from '../components/ui/NotificationStack.jsx'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const notificationIdRef = useRef(0)
  const timeoutsRef = useRef(new Map())

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    const timeoutId = timeoutsRef.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const pushNotification = useCallback(
    (message, variant = 'error', title = 'Notification') => {
      const key = `${variant}:${title}:${message}`
      setNotifications((prev) => {
        const existingIndex = prev.findIndex((item) => item.key === key)
        if (existingIndex >= 0) {
          const existing = prev[existingIndex]
          const existingTimeout = timeoutsRef.current.get(existing.id)
          if (existingTimeout) clearTimeout(existingTimeout)
          const timeoutId = setTimeout(
            () => dismissNotification(existing.id),
            7000,
          )
          timeoutsRef.current.set(existing.id, timeoutId)
          const next = [...prev]
          next[existingIndex] = { ...existing, message, variant, title }
          return next
        }
        const id = `notif-${Date.now()}-${notificationIdRef.current + 1}`
        notificationIdRef.current += 1
        const timeoutId = setTimeout(() => dismissNotification(id), 7000)
        timeoutsRef.current.set(id, timeoutId)
        return [
          ...prev,
          {
            id,
            key,
            message,
            variant,
            title,
          },
        ]
      })
    },
    [dismissNotification],
  )

  return (
    <NotificationContext.Provider value={{ pushNotification }}>
      {children}
      <NotificationStack
        items={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
