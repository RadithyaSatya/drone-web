import MapPanel from '../panels/MapPanel.jsx'
import { useCallback, useState } from 'react'
import MissionPanel from '../panels/MissionPanel.jsx'
import CctvPanel from '../panels/CctvPanel.jsx'
import DronePanel from '../panels/DronePanel.jsx'

function DashboardGrid() {
  const [waypoints, setWaypoints] = useState([])
  const [isPlanning, setIsPlanning] = useState(false)

  const handleAddWaypoint = useCallback((latitude, longitude) => {
    setWaypoints((prev) => [
      ...prev,
      {
        sequence_order: prev.length + 1,
        latitude,
        longitude,
        altitude: 50,
        action: 'PHOTO',
        action_duration: 5,
      },
    ])
  }, [])

  const handleClearWaypoints = useCallback(() => {
    setWaypoints([])
  }, [])

  const handleStartPlanning = useCallback(() => {
    setIsPlanning(true)
    setWaypoints([])
  }, [])

  const handleFinishPlanning = useCallback(() => {
    setIsPlanning(false)
  }, [])

  return (
    <main className="flex-1 min-h-0 bg-slate-950 px-6 py-5">
      <div className="grid h-full grid-cols-1 gap-6 min-[900px]:grid-cols-2 min-[900px]:grid-rows-2 min-[900px]:auto-rows-fr">
        <MapPanel
          className="min-[900px]:order-1"
          waypoints={waypoints}
          onAddWaypoint={handleAddWaypoint}
          canAddWaypoints={isPlanning}
        />
        <MissionPanel
          className="min-[900px]:order-3"
          waypoints={waypoints}
          onClearWaypoints={handleClearWaypoints}
          onStartPlanning={handleStartPlanning}
          onFinishPlanning={handleFinishPlanning}
          isPlanning={isPlanning}
        />
        <CctvPanel className="min-[900px]:order-2" />
        <DronePanel className="min-[900px]:order-4" />
      </div>
    </main>
  )
}

export default DashboardGrid
