import { useEffect, useMemo, useState } from 'react'
import Panel from '../ui/Panel.jsx'
import {
  createMission,
  getMissionsByUser,
} from '../../services/missionsService.js'

const REPEAT_OPTIONS = [
  { label: 'One Time', value: 'one_time' },
  { label: 'Repeat', value: 'repeat' },
]

const TIME_OPTIONS = [
  { label: 'Now', value: 'now' },
  { label: 'Later', value: 'later' },
]

const getCurrentCoords = () =>
  new Promise((resolve, reject) => {
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
  onStartPlanning,
  onFinishPlanning,
  isPlanning,
}) {
  const [missions, setMissions] = useState([])
  const [fetchError, setFetchError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [missionName, setMissionName] = useState('Mission A')
  const [timeMode, setTimeMode] = useState('now')
  const [repeatMode, setRepeatMode] = useState('one_time')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const userId = Number(import.meta.env.VITE_USER_ID || 1)
  const uavId = Number(import.meta.env.VITE_UAV_ID || 1)

  const scheduleValue = useMemo(() => {
    if (timeMode === 'now') {
      return formatSchedule(getDefaultSchedule())
    }
    if (scheduleDate && scheduleTime) {
      return `${scheduleDate} ${scheduleTime}:00`
    }
    return formatSchedule(getDefaultSchedule())
  }, [timeMode, scheduleDate, scheduleTime])

  const canSave =
    isPlanning &&
    waypoints.length > 0 &&
    (timeMode === 'now' || (scheduleDate && scheduleTime))

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

  const handleCreateMission = async () => {
    setUploadError('')
    if (!canSave) {
      setUploadError('Lengkapi waktu dan waypoint sebelum menyimpan.')
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
        schedule: scheduleValue,
        is_recurring: repeatMode === 'repeat',
        status: 'Waiting',
        waypoints,
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
    <Panel title="Missions" titleId="panel-missions" className={className}>
      <div className="flex flex-col gap-4 text-sm text-slate-200">
        <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>Mission List</span>
            <span>{missions.length} Items</span>
          </div>
          {fetchError ? (
            <p className="text-sm text-rose-300">{fetchError}</p>
          ) : null}
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
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
                  <p className="text-xs text-slate-400">{mission.schedule}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                  {mission.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isPlanning ? (
            <button
              type="button"
              onClick={onStartPlanning}
              className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
            >
              Create Mission
            </button>
          ) : (
            <>
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
            </>
          )}
          {!isPlanning ? (
            <span className="text-xs text-slate-400">
              Klik Create Mission untuk mulai tambah waypoint.
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 min-[900px]:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Mission Name
            </span>
            <input
              type="text"
              value={missionName}
              onChange={(event) => setMissionName(event.target.value)}
              disabled={!isPlanning}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Time Mode
            </span>
            <select
              value={timeMode}
              onChange={(event) => setTimeMode(event.target.value)}
              disabled={!isPlanning}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
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
              disabled={timeMode !== 'later' || !isPlanning}
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
              disabled={timeMode !== 'later' || !isPlanning}
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
              disabled={!isPlanning}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
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
          disabled={!canSave}
          className="w-full rounded-lg border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 min-[900px]:w-auto"
        >
          Save Mission
        </button>
      </div>
    </Panel>
  )
}

export default MissionPanel
