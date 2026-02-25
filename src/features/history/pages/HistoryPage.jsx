import { useCallback, useEffect, useMemo, useState } from 'react'
import AppHeader from '../../../shared/components/AppHeader.jsx'
import Panel from '../../../shared/components/ui/Panel.jsx'
import MapPanel from '../../dashboard/panels/MapPanel.jsx'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { useNotifications } from '../../../shared/contexts/NotificationContext.jsx'
import {
  getMissionHistory,
  getMissionHistoryDetail,
} from '../services/historyService.js'

const parseDateValue = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date
  if (typeof value === 'string') {
    const normalized = value.replace(' ', 'T')
    const normalizedDate = new Date(normalized)
    if (!Number.isNaN(normalizedDate.getTime())) return normalizedDate
  }
  return null
}

const formatScheduleParts = (value) => {
  const date = parseDateValue(value)
  if (!date) {
    return {
      date: value ? String(value) : '-',
      time: '-',
    }
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}:${seconds}`,
  }
}

const formatDurationClock = (durationSeconds, startValue, endValue) => {
  const safeSeconds =
    durationSeconds === 0 || Number.isFinite(durationSeconds)
      ? Number(durationSeconds)
      : null
  let totalSeconds = safeSeconds
  if (totalSeconds === null) {
    const start = parseDateValue(startValue)
    const end = parseDateValue(endValue)
    if (!start || !end) return '-'
    const diffMs = end - start
    if (diffMs <= 0) return '-'
    totalSeconds = Math.round(diffMs / 1000)
  }
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '-'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function HistoryPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const { logout } = useAuth()
  const { pushNotification } = useNotifications()

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getMissionHistory({ page, limit })
      const fallbackTotalPages =
        data.total && data.limit
          ? Math.max(1, Math.ceil(data.total / data.limit))
          : 1
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
      setLimit(data.limit)
      setTotalPages(
        Number.isFinite(data.total_pages) && data.total_pages
          ? data.total_pages
          : fallbackTotalPages,
      )
      setHasNext(
        typeof data.has_next === 'boolean'
          ? data.has_next
          : data.page < fallbackTotalPages,
      )
      setHasPrev(
        typeof data.has_prev === 'boolean' ? data.has_prev : data.page > 1,
      )
      setNextPage(
        data.next_page !== null && data.next_page !== undefined
          ? data.next_page
          : null,
      )
      setPrevPage(
        data.prev_page !== null && data.prev_page !== undefined
          ? data.prev_page
          : null,
      )
      if (data.items.length) {
        const currentIds = new Set(data.items.map((item) => item.id))
        setSelectedId((prev) => {
          if (prev && currentIds.has(prev)) return prev
          return data.items[0].id
        })
      } else {
        setSelectedId(null)
      }
    } catch (err) {
      setError('Unable to load history. Please try again shortly.')
      pushNotification(
        'Failed to load history. Check your connection and try again.',
        'error',
        'History',
      )
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, pushNotification])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleLogout = () => {
    logout()
    pushNotification('You have signed out.', 'info', 'Auth')
  }

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    let isActive = true
    setDetail(null)
    getMissionHistoryDetail(selectedId)
      .then((data) => {
        if (!isActive) return
        setDetail(data)
      })
      .catch(() => {
        if (!isActive) return
        pushNotification(
          'Failed to load mission detail. Check your connection and try again.',
          'error',
          'History',
        )
      })
    return () => {
      isActive = false
    }
  }, [selectedId, pushNotification])

  const selectedItem = items.find((item) => item.id === selectedId)
  const missionSnapshot = detail?.mission_snapshot
  const listSnapshot = selectedItem?.mission_snapshot
  const waypoints =
    missionSnapshot?.waypoints?.length > 0
      ? missionSnapshot.waypoints
      : listSnapshot?.waypoints ?? []

  const buildTaskLabel = useCallback((waypointsValue) => {
    if (!Array.isArray(waypointsValue) || waypointsValue.length === 0) {
      return '-'
    }
    const actions = waypointsValue
      .map((point) => String(point?.action || '').trim())
      .filter(Boolean)
    if (actions.length === 0) return '-'
    const uniqueActions = Array.from(new Set(actions))
    if (uniqueActions.length === 1) return uniqueActions[0]
    return 'Multiple Tasks'
  }, [])

  const formatPinPoints = useCallback((waypointsValue) => {
    const count = Array.isArray(waypointsValue) ? waypointsValue.length : 0
    if (!count) return '-'
    return `${count} Pin point`
  }, [])

  const tableRows = useMemo(
    () =>
      items.map((item) => {
        const snapshot = item.mission_snapshot
        const waypointList = snapshot?.waypoints ?? []
        const scheduleParts = formatScheduleParts(snapshot?.schedule)
        return {
          ...item,
          scheduleDate: scheduleParts.date,
          scheduleTime: scheduleParts.time,
          pinPointLabel: formatPinPoints(waypointList),
          taskLabel: buildTaskLabel(waypointList),
          durationLabel: formatDurationClock(
            item.duration_seconds,
            item.started_at,
            item.completed_at,
          ),
        }
      }),
    [items, buildTaskLabel, formatPinPoints],
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AppHeader onLogout={handleLogout} />
      <main className="flex-1 px-6 py-5">
        <div className="w-full">
          <div className="grid gap-6 min-[1100px]:grid-cols-[1.45fr_1fr]">
            <Panel title="Mission History" titleId="panel-history">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Mission History
                  </p>
                  <p className="text-sm text-slate-300">
                    Total {total} missions recorded.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    Limit
                    <select
                      value={limit}
                      onChange={(event) => {
                        setPage(1)
                        setLimit(Number(event.target.value))
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={loadHistory}
                    className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-800"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-2xl border border-slate-800/70">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Mission</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Pin Point</th>
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {isLoading ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-slate-400"
                          colSpan={5}
                        >
                          Loading history...
                        </td>
                      </tr>
                    ) : items.length ? (
                      tableRows.map((item) => {
                        const isSelected = item.id === selectedId
                        return (
                          <tr
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setSelectedId(item.id)
                              }
                            }}
                            className={`cursor-pointer hover:bg-slate-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
                              isSelected ? 'bg-slate-900/60' : ''
                            }`}
                            aria-label={`Open mission history ${item.id}`}
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-slate-100">
                                {item.mission_name || 'Untitled'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-slate-200">
                                {item.scheduleDate}
                              </div>
                              <div className="text-xs text-slate-400">
                                {item.scheduleTime}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-sm font-semibold ${
                                  item.pinPointLabel === '-'
                                    ? 'text-slate-400'
                                    : 'text-sky-300 underline decoration-sky-500/40 underline-offset-2'
                                }`}
                              >
                                {item.pinPointLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {item.taskLabel}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {item.durationLabel}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-slate-400"
                          colSpan={5}
                        >
                          No mission history yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                <div>
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((prev) =>
                        prevPage ? prevPage : Math.max(1, prev - 1),
                      )
                    }
                    disabled={!hasPrev || isLoading}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((prev) =>
                        nextPage ? nextPage : Math.min(totalPages, prev + 1),
                      )
                    }
                    disabled={!hasNext || isLoading}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Panel>

            <div className="flex flex-col gap-6">
              <MapPanel
                className="min-h-[420px]"
                waypoints={waypoints}
                canAddWaypoints={false}
                fitToWaypoints
                showOverlay={false}
                showMaximize={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HistoryPage
