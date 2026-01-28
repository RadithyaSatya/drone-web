import { useEffect, useRef, useState } from 'react'
import Panel from '../ui/Panel.jsx'
import {
  createMission,
  getMissionsByUser,
} from '../../services/missionsService.js'
import { getEnvCoords } from '../../utils/location.js'

const REPEAT_OPTIONS = [
  { label: 'One Time', value: 'one_time' },
  { label: 'Repeat', value: 'repeat' },
]

const TIME_OPTIONS = [
  { label: 'Now', value: 'now' },
  { label: 'Later', value: 'later' },
]

let dockingSocket = null
let dockingSocketUsers = 0
let dockingSocketCloseTimer = null

const ACTION_OPTIONS = [
  { label: 'Select action', value: '' },
  { label: 'Take Picture', value: 'Take Picture' },
  { label: 'Record Video', value: 'Record Video' },
]

const getCurrentCoords = () => {
  const envCoords = getEnvCoords()
  if (envCoords) {
    return Promise.resolve({
      latitude: envCoords.lat,
      longitude: envCoords.lon,
    })
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  })
}

const isRainyWeather = (code) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95

const checkWeather = async () => {
  const { latitude, longitude } = await getCurrentCoords()
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  const weatherCode = data?.current_weather?.weathercode
  if (typeof weatherCode !== 'number') return null
  return weatherCode
}

const padNumber = (value) => String(value).padStart(2, '0')

const formatSchedule = (date) => {
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())
  const hour = padNumber(date.getHours())
  const minute = padNumber(date.getMinutes())
  return `${year}-${month}-${day} ${hour}:${minute}:00`
}

const getDefaultSchedule = () => new Date(Date.now() + 120_000)

function MissionPanel({
  className,
  waypoints,
  onClearWaypoints,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onStartPlanning,
  onFinishPlanning,
  isPlanning,
  planningStep,
  onPlanningStepChange,
  showHideButton = false,
  onHide,
}) {
  const localStepFallback = useRef('waypoints')
  const currentStep = planningStep ?? localStepFallback.current
  const setPlanningStep = (nextStep) => {
    localStepFallback.current = nextStep
    onPlanningStepChange?.(nextStep)
  }
  const [missions, setMissions] = useState([])
  const [fetchError, setFetchError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [missionName, setMissionName] = useState('')
  const [timeMode, setTimeMode] = useState('now')
  const [repeatMode, setRepeatMode] = useState('one_time')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [dockingStatus, setDockingStatus] = useState('Offline')

  const userId = Number(import.meta.env.VITE_USER_ID || 1)
  const uavId = Number(import.meta.env.VITE_UAV_ID || 1)

  const resolveSchedule = () => {
    if (timeMode === 'now') {
      return formatSchedule(getDefaultSchedule())
    }
    if (scheduleDate && scheduleTime) {
      return `${scheduleDate} ${scheduleTime}:00`
    }
    return formatSchedule(getDefaultSchedule())
  }

  const canSave =
    isPlanning &&
    waypoints.length > 0 &&
    (timeMode === 'now' || (scheduleDate && scheduleTime)) &&
    missionName.trim().length > 0

  const allWaypointsComplete =
    waypoints.length > 0 &&
    waypoints.every((point) => {
      const hasAltitude = Number.isFinite(point.altitude)
      const hasTilt = Number.isFinite(point.camera_tilt)
      const hasAction = Boolean(point.action)
      if (!hasAltitude || !hasTilt || !hasAction) return false
      if (point.action === 'Record Video') {
        return (
          Number.isFinite(point.action_duration) && point.action_duration > 0
        )
      }
      return true
    })

  const canEditMissionDetails =
    isPlanning && allWaypointsComplete && currentStep === 'schedule'

  const handleWaypointFieldChange = (index, field, value) => {
    if (!onUpdateWaypoint) return
    onUpdateWaypoint(index, { [field]: value })
  }

  const loadMissions = async () => {
    setFetchError('')
    try {
      const data = await getMissionsByUser(userId)
      setMissions(data)
    } catch (error) {
      setFetchError('Tidak bisa terhubung ke server')
    }
  }

  useEffect(() => {
    loadMissions()
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const envWsUrl = import.meta.env.VITE_WS_DOCKING_URL
    const apiBase = import.meta.env.VITE_API_BASE_URL
    const fallbackBase = window.location.origin
    const rawBase = apiBase && apiBase.startsWith('http') ? apiBase : fallbackBase
    const wsBase = rawBase.replace(/^http/, 'ws')
    const wsUrl = envWsUrl || `${wsBase}/ws/docking`

    dockingSocketUsers += 1
    if (dockingSocketCloseTimer) {
      clearTimeout(dockingSocketCloseTimer)
      dockingSocketCloseTimer = null
    }

    let offlineTimer = null
    const markOfflineSoon = () => {
      if (offlineTimer) clearTimeout(offlineTimer)
      offlineTimer = setTimeout(() => {
        setDockingStatus('Offline')
      }, 8000)
    }

    if (!dockingSocket || dockingSocket.readyState > WebSocket.OPEN) {
      dockingSocket = new WebSocket(wsUrl)
    }

    dockingSocket.onopen = () => {
      console.log('[dock-ws] connected')
      setDockingStatus('Online')
      markOfflineSoon()
    }
    dockingSocket.onmessage = (event) => {
      console.log('[dock-ws] message', event.data)
      if (offlineTimer) clearTimeout(offlineTimer)
      try {
        const data = JSON.parse(event.data)
        if (typeof data?.online === 'boolean') {
          setDockingStatus(data.online ? 'Online' : 'Offline')
          markOfflineSoon()
          return
        }
        const statusValue =
          typeof data === 'string'
            ? data
            : data?.status ?? data?.state ?? data?.docking
        if (typeof statusValue === 'string') {
          const normalized = statusValue.trim().toLowerCase()
          if (normalized === 'on' || normalized === 'online') {
            setDockingStatus('Online')
          } else if (
            normalized === 'off' ||
            normalized === 'offline' ||
            normalized === 'disconnect' ||
            normalized === 'disconnected'
          ) {
            setDockingStatus('Offline')
          } else {
            setDockingStatus(statusValue)
          }
          markOfflineSoon()
          return
        }
        if (typeof statusValue === 'boolean') {
          setDockingStatus(statusValue ? 'Online' : 'Offline')
          markOfflineSoon()
        }
      } catch (error) {
        setDockingStatus('Unknown')
      }
    }
    dockingSocket.onerror = () => {
      console.log('[dock-ws] error')
      setDockingStatus('Offline')
    }
    dockingSocket.onclose = () => {
      console.log('[dock-ws] closed')
      setDockingStatus('Offline')
    }

    return () => {
      if (offlineTimer) clearTimeout(offlineTimer)
      dockingSocketUsers -= 1
      if (dockingSocketUsers <= 0) {
        dockingSocketCloseTimer = setTimeout(() => {
          if (dockingSocket && dockingSocketUsers <= 0) {
            dockingSocket.close()
          }
          dockingSocketCloseTimer = null
        }, 300)
      }
    }
  }, [])

  useEffect(() => {
    if (!isPlanning) {
      setPlanningStep('waypoints')
    }
  }, [isPlanning])

  const handleCreateMission = async () => {
    setUploadError('')
    if (!canSave || !allWaypointsComplete) {
      setUploadError('Lengkapi nama misi, waktu, dan waypoint sebelum menyimpan.')
      return
    }
    try {
      if (timeMode === 'now') {
        const weatherCode = await checkWeather()
        if (weatherCode !== null && isRainyWeather(weatherCode)) {
          window.alert(
            'Cuaca saat ini berpotensi hujan/drizzle. Pertimbangkan menunda misi.',
          )
        }
      }

      const payload = {
        user_id: userId,
        uav_id: uavId,
        mission_name: missionName,
        schedule: resolveSchedule(),
        is_recurring: repeatMode === 'repeat',
        status: 'Waiting',
        waypoints: waypoints.map((point) => ({
          sequence_order: point.sequence_order,
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude,
          action: point.action,
          action_duration:
            point.action === 'Record Video' ? point.action_duration : null,
        })),
      }

      const success = await createMission(payload)
      if (!success) {
        setUploadError('Failed to save mission')
        return
      }

      await loadMissions()
      if (onClearWaypoints) {
        onClearWaypoints()
      }
      if (onFinishPlanning) {
        onFinishPlanning()
      }
    } catch (error) {
      setUploadError('Failed to save mission')
    }
  }

  return (
    <Panel
      title="Missions"
      titleId="panel-missions"
      className={className}
      actions={
        showHideButton ? (
          <button
            type="button"
            onClick={onHide}
            aria-label="Hide mission panel"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 text-sm text-slate-200 max-[899px]:max-h-[65vh] max-[899px]:overflow-y-auto max-[899px]:pr-1">
        {!isPlanning ? (
          <>
            <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Mission List</span>
                <span>{missions.length} Items</span>
              </div>
              {fetchError ? (
                <p className="text-sm text-rose-300">{fetchError}</p>
              ) : null}
              <div className="flex min-h-[240px] max-h-40 flex-col gap-2 overflow-y-auto">
                {missions.length === 0 && !fetchError ? (
                  <p className="text-xs text-slate-500">No missions found.</p>
                ) : null}
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {mission.mission_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {mission.schedule}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                        {mission.status}
                      </span>
                      <span className="rounded-full border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-400">
                        {mission.is_recurring ? 'Repeat' : 'One Time'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartPlanning}
              className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
            >
              Create Mission
            </button>
            <span className="text-xs text-slate-400">
              Klik Create Mission untuk mulai tambah waypoint.
            </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onClearWaypoints) onClearWaypoints()
                  if (onFinishPlanning) onFinishPlanning()
                }}
                className="rounded-lg border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-100 transition hover:bg-amber-500/30"
              >
                Cancel Planning
              </button>
              <span className="text-xs text-slate-400">
                Planning mode aktif. Klik map untuk tambah waypoint.
              </span>
            </div>

            {currentStep === 'waypoints' ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>Waypoint Details</span>
                  <span>{waypoints.length} Items</span>
                </div>
              <div className="flex min-h-[240px] max-h-56 flex-col gap-3 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  {waypoints.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Klik map untuk menambah waypoint.
                    </p>
                  ) : null}
                  {waypoints.map((point, index) => (
                    <div
                      key={`${point.latitude}-${point.longitude}-${index}`}
                      className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-900/60 p-3"
                    >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>Point {point.sequence_order || index + 1}</span>
                      <div className="flex items-center gap-3">
                        <span>
                          {point.latitude.toFixed(6)},{' '}
                          {point.longitude.toFixed(6)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteWaypoint?.(index)}
                          disabled={!isPlanning}
                          className="text-xs font-semibold uppercase tracking-wider text-rose-300 transition hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                      <div className="grid gap-3 min-[900px]:grid-cols-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-slate-500">
                            Altitude (m)
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={point.altitude ?? ''}
                            onChange={(event) =>
                              handleWaypointFieldChange(
                                index,
                                'altitude',
                                event.target.value === ''
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            disabled={!isPlanning}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-slate-500">
                            Camera Tilt
                          </span>
                          <input
                            type="number"
                            min="-90"
                            max="90"
                            step="1"
                            value={point.camera_tilt ?? ''}
                            onChange={(event) =>
                              handleWaypointFieldChange(
                                index,
                                'camera_tilt',
                                event.target.value === ''
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            disabled={!isPlanning}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-slate-500">
                            Action
                          </span>
                          <select
                            value={point.action || ''}
                            onChange={(event) => {
                              if (!onUpdateWaypoint) return
                              const nextAction = event.target.value
                              onUpdateWaypoint(index, {
                                action: nextAction,
                              action_duration:
                                  nextAction === 'Record Video'
                                    ? point.action_duration
                                    : null,
                            })
                          }}
                            disabled={!isPlanning}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                          >
                            {ACTION_OPTIONS.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                                disabled={option.value === ''}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    {point.action === 'Record Video' ? (
                        <label className="flex flex-col gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-slate-500">
                            Video Duration (sec)
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={point.action_duration ?? ''}
                            onChange={(event) =>
                              handleWaypointFieldChange(
                                index,
                                'action_duration',
                                event.target.value === ''
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            disabled={!isPlanning}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                          />
                        </label>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!allWaypointsComplete ? (
              <p className="text-xs text-amber-200">
                Lengkapi semua data waypoint sebelum mengatur waktu dan
                menyimpan misi.
              </p>
            ) : null}

            {currentStep === 'waypoints' ? (
              <button
                type="button"
                onClick={() => setPlanningStep('schedule')}
                disabled={!allWaypointsComplete}
                className="w-full rounded-lg border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 min-[900px]:w-auto"
              >
                Next: Schedule
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPlanningStep('waypoints')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 min-[900px]:w-auto"
                >
                  Back to Waypoints
                </button>

                <div className="grid gap-4 min-[900px]:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Mission Name
                    </span>
                    <input
                      type="text"
                      value={missionName}
                      onChange={(event) => setMissionName(event.target.value)}
                      disabled={!canEditMissionDetails}
                      placeholder="New Mission"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Time Mode
                    </span>
                    <select
                      value={timeMode}
                      onChange={(event) => setTimeMode(event.target.value)}
                      disabled={!canEditMissionDetails}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Date
                    </span>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(event) => setScheduleDate(event.target.value)}
                      disabled={timeMode !== 'later' || !canEditMissionDetails}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Time
                    </span>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(event) => setScheduleTime(event.target.value)}
                      disabled={timeMode !== 'later' || !canEditMissionDetails}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Repeat
                    </span>
                    <select
                      value={repeatMode}
                      onChange={(event) => setRepeatMode(event.target.value)}
                      disabled={!canEditMissionDetails}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                    >
                      {REPEAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span>Waypoints</span>
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm normal-case text-slate-200">
                      <span>{waypoints.length} Points</span>
                      <button
                        type="button"
                        onClick={onClearWaypoints}
                        disabled={!isPlanning}
                        className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-sky-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {uploadError ? (
                  <p className="text-sm text-rose-300">{uploadError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCreateMission}
                  disabled={!canSave || !allWaypointsComplete}
                  className="w-full rounded-lg border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 min-[900px]:w-auto"
                >
                  Save Mission
                </button>
              </>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

export default MissionPanel
