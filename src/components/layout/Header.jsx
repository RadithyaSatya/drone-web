import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function Header() {
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isOverlayMode, setIsOverlayMode] = useState(false)
  const buttonRef = useRef(null)
  const statusRef = useRef(null)

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

  return (
    <header className="relative z-[60] flex flex-col gap-3 border-b border-slate-800 bg-slate-950/80 px-6 py-3 text-slate-100 backdrop-blur min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
      <div className="flex items-center justify-between gap-3 min-[900px]:block">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Control Center
          </p>
          <h1 className="text-2xl font-semibold text-sky-200">X-Flight</h1>
        </div>
        <div className="relative flex items-center justify-end min-[900px]:hidden">
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
      <div className="relative hidden items-center justify-end min-[900px]:flex">
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
        {isStatusOpen
          ? createPortal(
              <div
                ref={statusRef}
                className="fixed right-4 top-16 z-[9999] w-64 max-w-[90vw] rounded-xl border border-slate-800 bg-slate-950/95 p-4 text-xs text-slate-200 shadow-lg shadow-slate-950/40"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <span>Drone Status</span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                    <span>Battery</span>
                    <span className="text-slate-100">82%</span>
                  </div>
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
                  <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                    <span>RTK</span>
                    <span className="text-slate-100">Surveyed</span>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </header>
  )
}

export default Header
