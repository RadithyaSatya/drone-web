import { apiClient } from '../../../shared/services/apiClient.js'

const normalizeNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeOptionalNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeWaypoints = (waypoints) => {
  if (!Array.isArray(waypoints)) return []
  return waypoints.map((point, index) => ({
    id: point?.id ?? null,
    action: point?.action ?? '',
    altitude: normalizeOptionalNumber(point?.altitude, null),
    latitude: normalizeOptionalNumber(point?.latitude, null),
    longitude: normalizeOptionalNumber(point?.longitude, null),
    mission_id: point?.mission_id ?? null,
    sequence_order: normalizeOptionalNumber(
      point?.sequence_order,
      index + 1,
    ),
    action_duration: normalizeOptionalNumber(point?.action_duration, null),
  }))
}

const normalizeMissionSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      id: null,
      status: 'Unknown',
      uav_id: null,
      user_id: null,
      schedule: null,
      timestamp: null,
      waypoints: [],
      deleted_at: null,
      is_recurring: false,
      mission_name: null,
    }
  }
  return {
    id: snapshot?.id ?? null,
    status: snapshot?.status ?? 'Unknown',
    uav_id: snapshot?.uav_id ?? null,
    user_id: snapshot?.user_id ?? null,
    schedule: snapshot?.schedule ?? null,
    timestamp: snapshot?.timestamp ?? null,
    waypoints: normalizeWaypoints(snapshot?.waypoints),
    deleted_at: snapshot?.deleted_at ?? null,
    is_recurring: Boolean(snapshot?.is_recurring),
    mission_name: snapshot?.mission_name ?? null,
  }
}

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    id: item?.id ?? null,
    mission_id: item?.mission_id ?? null,
    mission_name:
      item?.mission_name ?? item?.mission_snapshot?.mission_name ?? '-',
    user_id: item?.user_id ?? null,
    user_name: item?.user_name ?? null,
    uav_id: item?.uav_id ?? null,
    status: item?.status ?? 'Unknown',
    started_at: item?.started_at ?? null,
    completed_at: item?.completed_at ?? null,
    duration_seconds: item?.duration_seconds ?? null,
    created_at: item?.created_at ?? null,
    mission_snapshot: normalizeMissionSnapshot(item?.mission_snapshot),
  }))
}

const normalizeHistoryDetail = (item) => ({
  id: item?.id ?? null,
  mission_id: item?.mission_id ?? null,
  user_id: item?.user_id ?? null,
  uav_id: item?.uav_id ?? null,
  status: item?.status ?? 'Unknown',
  started_at: item?.started_at ?? null,
  completed_at: item?.completed_at ?? null,
  created_at: item?.created_at ?? null,
  duration_seconds: normalizeOptionalNumber(item?.duration_seconds, null),
  mission_snapshot: normalizeMissionSnapshot(item?.mission_snapshot),
})

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

const getMissionHistoryDetail = async (historyId) => {
  if (!historyId) return normalizeHistoryDetail(null)
  const data = await apiClient.get(`/mission-history/${historyId}`)
  return normalizeHistoryDetail(data)
}

export { getMissionHistory, getMissionHistoryDetail }
