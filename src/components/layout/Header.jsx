function Header() {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950/80 px-6 py-3 text-slate-100 backdrop-blur min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Control Center
        </p>
        <h1 className="text-2xl font-semibold text-sky-200">XFlight</h1>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-300" />
    </header>
  )
}

export default Header
