import { apiClient } from '../../../shared/services/apiClient.js'

const normalizeNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    id: item?.id ?? null,
    mission_id: item?.mission_id ?? null,
    mission_name: item?.mission_name ?? '-',
    user_id: item?.user_id ?? null,
    user_name: item?.user_name ?? null,
    uav_id: item?.uav_id ?? null,
    status: item?.status ?? 'Unknown',
    started_at: item?.started_at ?? null,
    completed_at: item?.completed_at ?? null,
    duration_seconds: item?.duration_seconds ?? null,
    created_at: item?.created_at ?? null,
  }))
}

const getMissionHistory = async ({ page = 1, limit = 20 } = {}) => {
  const data = await apiClient.get('/mission-history', {
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

export { getMissionHistory }
