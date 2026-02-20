const SERVER_ERROR_EVENT = 'server-error'
const SERVER_RECOVERY_EVENT = 'server-recovery'
const ERROR_THROTTLE_MS = 3000
const RECOVERY_THROTTLE_MS = 1000

let lastErrorAt = 0
let lastRecoveryAt = 0

const notifyServerError = ({ status, message, url } = {}) => {
  if (typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastErrorAt < ERROR_THROTTLE_MS) return
  lastErrorAt = now
  window.dispatchEvent(
    new CustomEvent(SERVER_ERROR_EVENT, {
      detail: {
        status: status ?? 500,
        message: message || 'The service is temporarily unavailable.',
        url,
        time: now,
      },
    }),
  )
}

const notifyServerRecovery = () => {
  if (typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastRecoveryAt < RECOVERY_THROTTLE_MS) return
  lastRecoveryAt = now
  window.dispatchEvent(
    new CustomEvent(SERVER_RECOVERY_EVENT, {
      detail: { time: now },
    }),
  )
}

export {
  SERVER_ERROR_EVENT,
  SERVER_RECOVERY_EVENT,
  notifyServerError,
  notifyServerRecovery,
}
