function MaximizeButton({
  isMaximized,
  onToggle,
  label = 'panel',
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isMaximized ? `Exit fullscreen ${label}` : `Maximize ${label}`}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
    >
      {isMaximized ? (
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
          <polyline points="4 10 4 4 10 4" />
          <polyline points="20 14 20 20 14 20" />
          <line x1="4" y1="4" x2="10" y2="10" />
          <line x1="20" y1="20" x2="14" y2="14" />
        </svg>
      ) : (
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
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )}
    </button>
  )
}

export default MaximizeButton
