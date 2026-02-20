import { useCallback, useEffect, useState } from 'react'
import AppHeader from '../../../shared/components/AppHeader.jsx'
import Panel from '../../../shared/components/ui/Panel.jsx'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { useNotifications } from '../../../shared/contexts/NotificationContext.jsx'
import { getMissionHistory } from '../services/historyService.js'

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatDuration = (durationSeconds, startValue, endValue) => {
  const safeSeconds =
    durationSeconds === 0 || Number.isFinite(durationSeconds)
      ? Number(durationSeconds)
      : null
  if (safeSeconds !== null) {
    const minutes = Math.floor(safeSeconds / 60)
    const seconds = Math.round(safeSeconds % 60)
    if (minutes <= 0) return `${seconds}s`
    return `${minutes}m ${seconds}s`
  }
  if (!startValue || !endValue) return '-'
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const diffMs = end - start
  if (diffMs <= 0) return '-'
  const totalSeconds = Math.round(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const getStatusStyle = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('complete')) {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  }
  if (normalized.includes('progress') || normalized.includes('running')) {
    return 'border-sky-500/40 bg-sky-500/10 text-sky-200'
  }
  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'border-rose-500/40 bg-rose-500/10 text-rose-200'
  }
  return 'border-slate-600/50 bg-slate-800/50 text-slate-200'
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AppHeader onLogout={handleLogout} />
      <main className="flex-1 px-6 py-5">
        <div className="mx-auto w-full max-w-6xl">
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
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {isLoading ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-slate-400"
                        colSpan={6}
                      >
                        Loading history...
                      </td>
                    </tr>
                  ) : items.length ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-slate-100">
                            {item.mission_name || 'Untitled'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusStyle(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatDateTime(item.started_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatDateTime(item.completed_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatDuration(
                            item.duration_seconds,
                            item.started_at,
                            item.completed_at,
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.user_name || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-slate-400"
                        colSpan={6}
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
        </div>
      </main>
    </div>
  )
}

export default HistoryPage
