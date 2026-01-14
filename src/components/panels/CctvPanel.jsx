import Panel from '../ui/Panel.jsx'

function CctvPanel({ className }) {
  return (
    <Panel title="CCTV Stream" titleId="panel-cctv" className={className}>
      {/* Replace with future WebRTC / RTSP integration */}
      <div
        role="img"
        aria-label="CCTV stream placeholder"
        className="flex aspect-[16/9] items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400"
      >
        CCTV Stream
      </div>
    </Panel>
  )
}

export default CctvPanel
