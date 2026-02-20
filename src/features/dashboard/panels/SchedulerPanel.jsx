import Panel from '../../../shared/components/ui/Panel.jsx'

function SchedulerPanel({ className }) {
  return (
    <Panel title="Scheduler" titleId="panel-scheduler" className={className}>
      {/* Replace with future mission scheduling logic */}
      <form className="grid gap-4 text-sm text-slate-200 min-[900px]:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Mission Name
          </span>
          <input
            type="text"
            name="missionName"
            placeholder="Survey Route A"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Date
          </span>
          <input
            type="date"
            name="missionDate"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Start Time
          </span>
          <input
            type="time"
            name="startTime"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Repeat Mode
          </span>
          <select
            name="repeatMode"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
          >
            <option>Once</option>
            <option>Daily</option>
            <option>Weekly</option>
          </select>
        </label>
        <button
          type="button"
          className="col-span-full w-full rounded-lg border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 min-[900px]:w-auto"
        >
          Save Schedule
        </button>
      </form>
    </Panel>
  )
}

export default SchedulerPanel
