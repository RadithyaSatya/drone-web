function ServerErrorPage({ detail, onRetry, onDismiss }) {
  if (!detail) return null

  const status = detail?.status ?? 500
  const message =
    detail?.message || 'The service is temporarily unavailable.'

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/95 px-6 py-10 text-slate-100">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">
              Service Issue
            </p>
            <h1 className="text-3xl font-semibold text-rose-200 font-display">
              Sorry, the service is having trouble
            </h1>
            <p className="text-sm text-slate-300">
              This is temporary. Please try again in a moment.
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Code {status}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {message}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
            >
              Try again
            </button>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerErrorPage
