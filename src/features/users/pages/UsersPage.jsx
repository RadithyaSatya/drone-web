import { useCallback, useEffect, useMemo, useState } from 'react'
import AppHeader from '../../../shared/components/AppHeader.jsx'
import Panel from '../../../shared/components/ui/Panel.jsx'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { useNotifications } from '../../../shared/contexts/NotificationContext.jsx'
import { getUsers, registerUser } from '../services/usersService.js'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function UsersPage() {
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

  const [form, setForm] = useState({
    email: '',
    username: '',
    dob: '',
    phone: '',
    pilot_cert: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { logout } = useAuth()
  const { pushNotification } = useNotifications()

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getUsers({ page, limit })
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
      setError('Unable to load users. Please try again shortly.')
      pushNotification(
        'Failed to load users. Check your connection and try again.',
        'error',
        'Users',
      )
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, pushNotification])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleLogout = () => {
    logout()
    pushNotification('You have signed out.', 'info', 'Auth')
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const canSubmit = useMemo(() => {
    return (
      form.email.trim() &&
      form.username.trim() &&
      form.dob &&
      form.phone.trim() &&
      form.pilot_cert.trim() &&
      form.password.trim()
    )
  }, [form])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    if (!canSubmit) {
      setSubmitError('Please complete all fields first.')
      return
    }
    setIsSubmitting(true)
    try {
      await registerUser({
        email: form.email.trim(),
        username: form.username.trim(),
        dob: form.dob,
        phone: form.phone.trim(),
        pilot_cert: form.pilot_cert.trim(),
        password: form.password,
      })
      pushNotification('User created successfully.', 'success', 'Users')
      setForm({
        email: '',
        username: '',
        dob: '',
        phone: '',
        pilot_cert: '',
        password: '',
      })
      setPage(1)
      loadUsers()
    } catch (err) {
      setSubmitError('Failed to create user. Please try again.')
      pushNotification('Failed to create user.', 'error', 'Users')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AppHeader onLogout={handleLogout} />
      <main className="flex-1 px-6 py-5">
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Panel title="Users" titleId="panel-users">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  User List
                </p>
                <p className="text-sm text-slate-300">
                  Total {total} users registered.
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
                  onClick={loadUsers}
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
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Pilot Cert</th>
                    <th className="px-4 py-3">DOB</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {isLoading ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-slate-400"
                        colSpan={7}
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : items.length ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3 text-slate-300">
                          {item.id ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-slate-100">
                            {item.username || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.pilot_cert || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatDate(item.dob)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatDateTime(item.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-slate-400"
                        colSpan={7}
                      >
                        No users yet.
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

          <Panel title="Register User" titleId="panel-register-user">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Username
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange('username')}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100"
                  placeholder="username"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100"
                  placeholder="user@example.com"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Date of Birth
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange('dob')}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100"
                  placeholder="+628123456789"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Pilot Cert
                <input
                  type="text"
                  name="pilot_cert"
                  value={form.pilot_cert}
                  onChange={handleChange('pilot_cert')}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100"
                  placeholder="CERT-001"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100"
                  placeholder="••••••••"
                />
              </label>
              {submitError ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                  {submitError}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="mt-2 w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {isSubmitting ? 'Saving...' : 'Register User'}
              </button>
            </form>
          </Panel>
        </div>
      </main>
    </div>
  )
}

export default UsersPage
