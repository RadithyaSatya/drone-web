function Header() {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4 text-slate-100 backdrop-blur min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Control Center
        </p>
        <h1 className="text-2xl font-semibold text-sky-200">XFlight</h1>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
          FC: Disconnected
        </span>
        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
          Mission: Idle
        </span>
      </div>
    </header>
  )
}

export default Header
