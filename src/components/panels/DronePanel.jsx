import Panel from '../ui/Panel.jsx'

function DronePanel({ className }) {
  return (
    <Panel title="Drone Stream" titleId="panel-drone" className={className}>
      {/* Replace with telemetry / FPV video integration */}
      <div
        role="img"
        aria-label="Drone stream placeholder"
        className="flex aspect-[16/9] items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400"
      >
        Drone Stream
      </div>
    </Panel>
  )
}

export default DronePanel
