import { apiClient } from '../../../shared/services/apiClient.js'

const normalizeNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    id: item?.id ?? null,
    email: item?.email ?? '-',
    username: item?.username ?? '-',
    dob: item?.dob ?? null,
    phone: item?.phone ?? '-',
    pilot_cert: item?.pilot_cert ?? '-',
    created_at: item?.created_at ?? null,
  }))
}

const getUsers = async ({ page = 1, limit = 20 } = {}) => {
  const data = await apiClient.get('/users', {
    query: { page, limit },
  })

  return {
    page: normalizeNumber(data?.page, page),
    limit: normalizeNumber(data?.limit, limit),
    total: normalizeNumber(data?.total, 0),
    total_pages: normalizeNumber(data?.total_pages, null),
    has_next: typeof data?.has_next === 'boolean' ? data.has_next : null,
    has_prev: typeof data?.has_prev === 'boolean' ? data.has_prev : null,
    next_page: data?.next_page ?? null,
    prev_page: data?.prev_page ?? null,
    items: normalizeItems(data?.items),
  }
}

const registerUser = async (payload) => {
  return apiClient.post('/register-user', payload)
}

export { getUsers, registerUser }
