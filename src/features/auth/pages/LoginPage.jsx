import { useState } from 'react'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedUsername = username.trim()

    if (!trimmedUsername || !password) {
      setError('Username and password are required.')
      return
    }

    setError('')
    if (!onLogin) return

    setIsSubmitting(true)
    try {
      const result = await onLogin({ username: trimmedUsername, password })
      if (result?.ok === false) {
        setError(result.message || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-[-10%] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-slate-500">
                  Sign In
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-sky-200 font-display">
                  X-Flight
                </h1>
                <p className="mt-4 text-sm text-slate-300">
                  Please log in to continue.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5">
                  <p className="text-sm font-semibold text-slate-100">
                    Protected Access
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Use the credentials provided by the admin.
                  </p>
                </div>
              </div>
            </div>
            <form
              className="flex flex-col gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-6"
              onSubmit={handleSubmit}
            >
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Sign In
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-100">
                  Sign In
                </h2>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Username
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="username"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Password
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </label>
              {error ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-xs text-slate-500">
                Need access? Contact the admin.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
