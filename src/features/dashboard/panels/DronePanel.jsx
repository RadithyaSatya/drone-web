import Panel from '../../../shared/components/ui/Panel.jsx'
import MaximizeButton from '../../../shared/components/ui/MaximizeButton.jsx'

function DronePanel({
  className,
  isMaximized = false,
  onToggleMaximize = () => {},
}) {
  return (
    <Panel
      title="Drone Stream"
      titleId="panel-drone"
      className={className}
      actions={
        <MaximizeButton
          isMaximized={isMaximized}
          onToggle={onToggleMaximize}
          label="drone"
        />
      }
    >
      <div
        role="img"
        aria-label="Drone stream placeholder"
        className="flex min-h-[280px] flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 min-[900px]:min-h-0"
      >
        Drone Stream
      </div>
    </Panel>
  )
}

export default DronePanel
