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

const resolveBaseUrl = (baseUrl) => {
  if (!baseUrl) return window.location.origin
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return baseUrl
  }
  if (baseUrl.startsWith('/')) {
    return `${window.location.origin}${baseUrl}`
  }
  return `${window.location.origin}/${baseUrl}`
}

const buildUrl = (baseUrl, path, query) => {
  const url = new URL(path, resolveBaseUrl(baseUrl))
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

const createApiClient = ({ baseUrl = '', getToken } = {}) => {
  const request = async ({ path, method = 'GET', query, body, headers = {}, timeoutMs }) => {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs ?? DEFAULT_TIMEOUT_MS
    )

    const url = buildUrl(baseUrl || window.location.origin, path, query)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(getToken ? { Authorization: `Bearer ${getToken()}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new ApiError('Request failed', {
          status: response.status,
          statusText: response.statusText,
          data,
          url,
        })
      }

      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', {
          status: 408,
          statusText: 'Timeout',
          data: null,
          url,
        })
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    request,
    get: (path, options = {}) => request({ path, method: 'GET', ...options }),
    post: (path, body, options = {}) =>
      request({ path, method: 'POST', body, ...options }),
    put: (path, body, options = {}) =>
      request({ path, method: 'PUT', body, ...options }),
    patch: (path, body, options = {}) =>
      request({ path, method: 'PATCH', body, ...options }),
    del: (path, options = {}) => request({ path, method: 'DELETE', ...options }),
  }
}

const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
})

export { ApiError, createApiClient, apiClient }
