import MapPanel from '../panels/MapPanel.jsx'
import { useCallback, useState } from 'react'
import MissionPanel from '../panels/MissionPanel.jsx'
import CctvPanel from '../panels/CctvPanel.jsx'
import DronePanel from '../panels/DronePanel.jsx'

function DashboardGrid() {
  const [waypoints, setWaypoints] = useState([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [planningStep, setPlanningStep] = useState('waypoints')

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

  return (
    <main className="flex-1 min-h-0 bg-slate-950 px-6 py-5">
      <div className="grid h-full grid-cols-1 gap-6 min-[900px]:grid-cols-2 min-[900px]:grid-rows-2 min-[900px]:auto-rows-fr">
        <MapPanel
          className="min-[900px]:order-1"
          waypoints={waypoints}
          onAddWaypoint={handleAddWaypoint}
          canAddWaypoints={isPlanning && planningStep === 'waypoints'}
        />
        <MissionPanel
          className="min-[900px]:order-3"
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
        <CctvPanel className="min-[900px]:order-2" />
        <DronePanel className="min-[900px]:order-4" />
      </div>
    </main>
  )
}

export default DashboardGrid
