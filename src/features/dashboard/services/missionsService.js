import { apiClient } from '../../../shared/services/apiClient.js'

const MISSION_STATUS = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
}

const normalizeStatus = (status) => {
  if (!status) return MISSION_STATUS.WAITING
  const normalized = String(status).trim().toUpperCase()
  return MISSION_STATUS[normalized] || MISSION_STATUS.WAITING
}

const mapMissionToUi = (mission) => ({
  ...mission,
  status: normalizeStatus(mission.status),
})

const getMissionsByUser = async () => {
  const data = await apiClient.get('/missions/me')
  const missions = Array.isArray(data) ? data : []
  return missions.map(mapMissionToUi)
}

const createMission = async (payload) => {
  const response = await apiClient.post('/register-mission', payload)
  if (response && response.isSuccessful === false) {
    return false
  }
  return true
}

const getTelemetry = async (missionId) => {
  const data = await apiClient.get(`/get-telemetry/${missionId}`)
  return Array.isArray(data?.telemetry) ? data.telemetry : []
}

export {
  MISSION_STATUS,
  createMission,
  getMissionsByUser,
  getTelemetry,
}
