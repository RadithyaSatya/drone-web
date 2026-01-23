function Panel({ title, titleId, actions, children, className }) {
  return (
    <section
      aria-labelledby={titleId}
      className={`flex h-full flex-col rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40 ${
        className || ''
      }`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 pb-3">
        <h2
          id={titleId}
          className="text-lg font-semibold text-sky-300 font-display"
        >
          {title}
        </h2>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 pt-4">{children}</div>
    </section>
  )
}

export default Panel
