function NotificationStack({ items = [], onDismiss }) {
  if (!items.length) return null

  const getStyles = (variant) => {
    switch (variant) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100'
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/80 text-amber-100'
      case 'info':
        return 'border-sky-500/40 bg-sky-950/80 text-sky-100'
      default:
        return 'border-rose-500/40 bg-rose-950/80 text-rose-100'
    }
  }

  return (
    <div className="fixed right-6 top-6 z-[9999] flex w-[320px] max-w-[90vw] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-lg shadow-slate-950/40 backdrop-blur ${getStyles(
            item.variant,
          )}`}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              {item.title}
            </p>
            <p className="text-sm text-slate-100">{item.message}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss?.(item.id)}
            aria-label="Dismiss notification"
            className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
          >
            Close
          </button>
        </div>
      ))}
    </div>
  )
}

export default NotificationStack
