import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function Header({ dockingStatus = 'Offline' }) {
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isOverlayMode, setIsOverlayMode] = useState(false)
  const buttonRef = useRef(null)
  const statusRef = useRef(null)
  const hoverCloseTimerRef = useRef(null)

  useEffect(() => {
    if (!isStatusOpen) return
    const handleClickOutside = (event) => {
      if (!statusRef.current) return
      if (
        !statusRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsStatusOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsStatusOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isStatusOpen])

  useEffect(() => {
    const handleMaximizeChange = (event) => {
      setIsOverlayMode(Boolean(event.detail?.isMaximized))
    }
    setIsOverlayMode(Boolean(window.__panelMaximized))
    window.addEventListener('panel-maximize-change', handleMaximizeChange)
    return () =>
      window.removeEventListener('panel-maximize-change', handleMaximizeChange)
  }, [])

  if (isOverlayMode) {
    return null
  }

  const openStatus = () => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current)
      hoverCloseTimerRef.current = null
    }
    setIsStatusOpen(true)
  }

  const closeStatusSoon = () => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current)
    }
    hoverCloseTimerRef.current = setTimeout(() => {
      setIsStatusOpen(false)
    }, 120)
  }

  return (
    <header className="relative z-[60] flex flex-col gap-3 border-b border-slate-800 bg-slate-950/80 px-6 py-3 text-slate-100 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Control Center
          </p>
          <h1 className="text-2xl font-semibold text-sky-200 font-display">
            X-Flight
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              type="button"
              aria-label="Battery status"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="18" height="10" rx="2" />
                <line x1="22" y1="11" x2="22" y2="13" />
                <line x1="6" y1="10" x2="14" y2="10" />
              </svg>
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-44 rounded-xl border border-slate-800 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-200 opacity-0 shadow-lg shadow-slate-950/40 transition group-hover:opacity-100">
              <div className="flex items-center justify-between uppercase tracking-[0.2em] text-slate-400">
                <span>Battery</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-100">
                <span>26V</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="relative group">
            <button
              type="button"
              aria-label="RTK status"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="10" r="2" />
                <path d="M6 10a6 6 0 0 1 12 0" />
                <path d="M3 10a9 9 0 0 1 18 0" />
                <line x1="12" y1="12" x2="12" y2="20" />
                <line x1="9" y1="20" x2="15" y2="20" />
              </svg>
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-44 rounded-xl border border-slate-800 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-200 opacity-0 shadow-lg shadow-slate-950/40 transition group-hover:opacity-100">
              <div className="flex items-center justify-between uppercase tracking-[0.2em] text-slate-400">
                <span>RTK</span>
              </div>
              <div className="mt-1 text-slate-100">Surveyed</div>
            </div>
          </div>
          <div className="relative group">
            <button
              type="button"
              aria-label="Docking status"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7h10l3 4v6H4v-6l3-4z" />
                <path d="M9 7v-2a3 3 0 0 1 6 0v2" />
                <circle cx="8" cy="14" r="1" />
                <circle cx="16" cy="14" r="1" />
                <path d="M12 12v3" />
              </svg>
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-44 rounded-xl border border-slate-800 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-200 opacity-0 shadow-lg shadow-slate-950/40 transition group-hover:opacity-100">
              <div className="flex items-center justify-between uppercase tracking-[0.2em] text-slate-400">
                <span>Docking</span>
              </div>
              <div className="mt-1 text-slate-100">{dockingStatus}</div>
            </div>
          </div>
          <div
            className="relative"
            onMouseEnter={openStatus}
            onMouseLeave={closeStatusSoon}
          >
            <button
              type="button"
              onClick={() => setIsStatusOpen((prev) => !prev)}
              aria-label="Open drone status"
              ref={buttonRef}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="6" r="2" />
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
                <circle cx="12" cy="12" r="2" />
                <line x1="8" y1="8" x2="10" y2="10" />
                <line x1="16" y1="8" x2="14" y2="10" />
                <line x1="8" y1="16" x2="10" y2="14" />
                <line x1="16" y1="16" x2="14" y2="14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isStatusOpen
        ? createPortal(
            <div
              ref={statusRef}
              className="fixed right-4 top-16 z-[9999] w-64 max-w-[90vw] rounded-xl border border-slate-800 bg-slate-950/95 p-4 text-xs text-slate-200 shadow-lg shadow-slate-950/40"
              onMouseEnter={openStatus}
              onMouseLeave={closeStatusSoon}
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <span>Drone Status</span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span>Weather</span>
                  <span className="text-slate-100">Clear</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span>Temp</span>
                  <span className="text-slate-100">29°C</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span>Humidity</span>
                  <span className="text-slate-100">68%</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span>Drone</span>
                  <span className="text-slate-100">Landed</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span>GPS</span>
                  <span className="text-slate-100">Fix</span>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  )
}

export default Header
