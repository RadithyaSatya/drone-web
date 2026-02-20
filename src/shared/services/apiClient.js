import { notifyServerError, notifyServerRecovery } from './serverStatus.js'

const DEFAULT_TIMEOUT_MS = 15000

class ApiError extends Error {
  constructor(message, { status, statusText, data, url }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
    this.url = url
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const AUTH_TOKEN_KEY = 'xflight-auth-token'

const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

const buildUrl = (path, query) => {
  let url = `${API_BASE}${path}`

  if (query && typeof query === 'object') {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        params.set(k, String(v))
      }
    })
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  return url
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

const createApiClient = ({ getToken } = {}) => {
  const resolveToken = getToken || getStoredToken
  const request = async ({
    path,
    method = 'GET',
    query,
    body,
    headers = {},
    timeoutMs,
  }) => {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs ?? DEFAULT_TIMEOUT_MS
    )

    const url = buildUrl(path, query)

    try {
      const token = resolveToken ? resolveToken() : null
      let response
      try {
        response = await fetch(url, {
          method,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })
      } catch (error) {
        if (error?.name !== 'AbortError') {
          notifyServerError({
            message: 'Connection issue. Please try again shortly.',
            url,
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
            url,
          })
        }
        throw new ApiError('Request failed', {
          status: response.status,
          statusText: response.statusText,
          data,
          url,
        })
      }

      notifyServerRecovery()
      return data
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    get: (path, options = {}) => request({ path, method: 'GET', ...options }),
    post: (path, body, options = {}) =>
      request({ path, method: 'POST', body, ...options }),
    put: (path, body, options = {}) =>
      request({ path, method: 'PUT', body, ...options }),
    patch: (path, body, options = {}) =>
      request({ path, method: 'PATCH', body, ...options }),
    del: (path, options = {}) =>
      request({ path, method: 'DELETE', ...options }),
  }
}

export const apiClient = createApiClient()
