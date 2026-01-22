import MapPanel from '../panels/MapPanel.jsx'
import { useCallback, useEffect, useState } from 'react'
import MissionPanel from '../panels/MissionPanel.jsx'
import CctvPanel from '../panels/CctvPanel.jsx'
import DronePanel from '../panels/DronePanel.jsx'

function DashboardGrid() {
  const [waypoints, setWaypoints] = useState([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [planningStep, setPlanningStep] = useState('waypoints')
  const [maximizedPanel, setMaximizedPanel] = useState(null)

  const handleAddWaypoint = useCallback((latitude, longitude) => {
    setWaypoints((prev) => [
      ...prev,
      {
        sequence_order: prev.length + 1,
        latitude,
        longitude,
        altitude: null,
        action: '',
        action_duration: null,
        camera_tilt: null,
      },
    ])
  }, [])

  const handleClearWaypoints = useCallback(() => {
    setWaypoints([])
  }, [])

  const handleDeleteWaypoint = useCallback((index) => {
    setWaypoints((prev) =>
      prev
        .filter((_, currentIndex) => currentIndex !== index)
        .map((point, idx) => ({
          ...point,
          sequence_order: idx + 1,
        })),
    )
  }, [])

  const handleUpdateWaypoint = useCallback((index, updates) => {
    setWaypoints((prev) =>
      prev.map((point, currentIndex) =>
        currentIndex === index ? { ...point, ...updates } : point,
      ),
    )
  }, [])

  const handleStartPlanning = useCallback(() => {
    setIsPlanning(true)
    setWaypoints([])
    setPlanningStep('waypoints')
  }, [])

  const handleFinishPlanning = useCallback(() => {
    setIsPlanning(false)
    setPlanningStep('waypoints')
  }, [])

  const isMapMaximized = maximizedPanel === 'map'
  const isCctvMaximized = maximizedPanel === 'cctv'
  const isDroneMaximized = maximizedPanel === 'drone'
  const isAnyMaximized = maximizedPanel !== null

  useEffect(() => {
    window.__panelMaximized = isAnyMaximized
    window.dispatchEvent(
      new CustomEvent('panel-maximize-change', {
        detail: { isMaximized: isAnyMaximized },
      }),
    )
  }, [isAnyMaximized])

  return (
    <main className="flex-1 min-h-0 bg-slate-950 px-6 py-5">
      <div className="grid h-full grid-cols-1 gap-6 min-[900px]:grid-cols-2">
        <div className="grid h-full gap-6 min-[900px]:grid-rows-[2.4fr_1.6fr]">
          {!isAnyMaximized || isMapMaximized ? (
            <MapPanel
              className={
                isMapMaximized
                  ? 'fixed inset-0 z-50 m-0 h-screen w-screen rounded-none border-0 bg-slate-950 shadow-none'
                  : ''
              }
              waypoints={waypoints}
              onAddWaypoint={handleAddWaypoint}
              canAddWaypoints={isPlanning && planningStep === 'waypoints'}
              isMaximized={isMapMaximized}
              onToggleMaximize={() =>
                setMaximizedPanel((prev) => (prev === 'map' ? null : 'map'))
              }
            />
          ) : null}
          {!isAnyMaximized ? (
            <MissionPanel
              waypoints={waypoints}
              onClearWaypoints={handleClearWaypoints}
              onUpdateWaypoint={handleUpdateWaypoint}
              onDeleteWaypoint={handleDeleteWaypoint}
              onStartPlanning={handleStartPlanning}
              onFinishPlanning={handleFinishPlanning}
              isPlanning={isPlanning}
              planningStep={planningStep}
              onPlanningStepChange={setPlanningStep}
            />
          ) : null}
        </div>
        {!isAnyMaximized ? (
          <div className="grid h-full gap-6 min-[900px]:grid-rows-2">
            <CctvPanel
              isMaximized={isCctvMaximized}
              onToggleMaximize={() =>
                setMaximizedPanel((prev) => (prev === 'cctv' ? null : 'cctv'))
              }
            />
            <DronePanel
              isMaximized={isDroneMaximized}
              onToggleMaximize={() =>
                setMaximizedPanel((prev) => (prev === 'drone' ? null : 'drone'))
              }
            />
          </div>
        ) : null}
      </div>
      {isMapMaximized ? (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[90vw] max-[899px]:left-1/2 max-[899px]:-translate-x-1/2 max-[899px]:w-[92vw] max-[899px]:max-w-[92vw]">
          <MissionPanel
            className="h-[70vh] max-h-[70vh] overflow-hidden max-[899px]:h-[45vh] max-[899px]:max-h-[45vh]"
            waypoints={waypoints}
            onClearWaypoints={handleClearWaypoints}
            onUpdateWaypoint={handleUpdateWaypoint}
            onDeleteWaypoint={handleDeleteWaypoint}
            onStartPlanning={handleStartPlanning}
            onFinishPlanning={handleFinishPlanning}
            isPlanning={isPlanning}
            planningStep={planningStep}
            onPlanningStepChange={setPlanningStep}
          />
        </div>
      ) : null}
      {isCctvMaximized ? (
        <CctvPanel
          className="fixed inset-0 z-50 m-0 h-screen w-screen rounded-none border-0 bg-slate-950 shadow-none"
          isMaximized
          onToggleMaximize={() => setMaximizedPanel(null)}
        />
      ) : null}
      {isDroneMaximized ? (
        <DronePanel
          className="fixed inset-0 z-50 m-0 h-screen w-screen rounded-none border-0 bg-slate-950 shadow-none"
          isMaximized
          onToggleMaximize={() => setMaximizedPanel(null)}
        />
      ) : null}
    </main>
  )
}

export default DashboardGrid
