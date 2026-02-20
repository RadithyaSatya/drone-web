import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  notifyServerError,
  notifyServerRecovery,
} from '../../../shared/services/serverStatus.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const API_ROOT = API_BASE.replace(/\/$/, '')
const AUTH_TOKEN_KEY = 'xflight-auth-token'

const readAuthToken = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

const persistAuthToken = (token) => {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readAuthToken())

  const setTokenAndPersist = useCallback((nextToken) => {
    setToken(nextToken)
    persistAuthToken(nextToken)
  }, [])

  const logout = useCallback(() => {
    setTokenAndPersist(null)
  }, [setTokenAndPersist])

  const login = useCallback(
    async ({ username, password }) => {
      try {
        const loginUrl = `${API_ROOT}/auth/login`
        let response
        try {
          response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          })
        } catch (error) {
          if (error?.name !== 'AbortError') {
            notifyServerError({
              message: 'Connection issue. Please try again shortly.',
              url: loginUrl,
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
              url: loginUrl,
            })
          }
          return {
            ok: false,
            message: data?.message || 'Login failed. Check your credentials.',
          }
        }

        notifyServerRecovery()
        const nextToken = data?.token || data?.access_token || data?.jwt
        if (!nextToken) {
          return {
            ok: false,
            message: 'Token not found in login response.',
          }
        }
        setTokenAndPersist(nextToken)
        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          message: 'Login failed. Please try again.',
        }
      }
    },
    [setTokenAndPersist],
  )

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [login, logout, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
