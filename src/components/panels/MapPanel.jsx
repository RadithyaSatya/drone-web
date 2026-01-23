import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import Panel from '../ui/Panel.jsx'
import { getEnvCoords } from '../../utils/location.js'
import dockingMarker from '../../assets/ic_mark_docking.png'
import MaximizeButton from '../ui/MaximizeButton.jsx'

function MapPanel({
  className,
  waypoints = [],
  onAddWaypoint,
  canAddWaypoints,
  isMaximized = false,
  onToggleMaximize = () => {},
}) {
  const envCoords = getEnvCoords()
  const [coords, setCoords] = useState(
    () => envCoords ?? { lat: -6.2, lon: 106.816666 },
  )
  const [locationStatus, setLocationStatus] = useState('Detecting...')
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const markersRef = useRef(null)
  const currentMarkerRef = useRef(null)
  const pathRef = useRef(null)
  const firstLegRef = useRef(null)
  const hasCenteredRef = useRef(false)
  const waypointIcon = useMemo(
    () => (sequence) =>
      L.divIcon({
        className: '',
        html: `<div style=\"width:22px;height:22px;border-radius:999px;background:#38bdf8;border:2px solid #0f172a;color:#0f172a;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 0 0 3px rgba(56,189,248,0.25);\">${sequence}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  )
  const dockingIcon = useMemo(
    () =>
      L.icon({
        iconUrl: dockingMarker,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    [dockingMarker],
  )

  useEffect(() => {
    if (envCoords) {
      setLocationStatus('Docking')
      return
    }
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ lat: latitude, lon: longitude })
        setLocationStatus('Live')
      },
      () => {
        setLocationStatus('Location blocked')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [envCoords])

  const addWaypointRef = useRef(onAddWaypoint)
  const canAddWaypointsRef = useRef(canAddWaypoints)

  useEffect(() => {
    addWaypointRef.current = onAddWaypoint
    canAddWaypointsRef.current = canAddWaypoints
  }, [onAddWaypoint, canAddWaypoints])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 12,
    }).setView([coords.lat, coords.lon], 14)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      },
    ).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    currentMarkerRef.current = L.marker([coords.lat, coords.lon], {
      icon: dockingIcon,
    }).addTo(map)
    pathRef.current = L.polyline([], {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.8,
      dashArray: '6 6',
    }).addTo(map)
    firstLegRef.current = L.polyline([], {
      color: '#38bdf8',
      weight: 2,
      opacity: 0.8,
      dashArray: '6 6',
    }).addTo(map)

    map.on('click', (event) => {
      if (!addWaypointRef.current || !canAddWaypointsRef.current) return
      const { lat, lng } = event.latlng
      addWaypointRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
    })

    mapRef.current = map

    requestAnimationFrame(() => {
      if (mapRef.current) mapRef.current.invalidateSize()
    })

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markersRef.current = null
      currentMarkerRef.current = null
      pathRef.current = null
      firstLegRef.current = null
      hasCenteredRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => {
        if (mapRef.current) mapRef.current.invalidateSize()
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize()
    })
    observer.observe(mapContainerRef.current)
    if (mapRef.current) mapRef.current.invalidateSize()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (locationStatus !== 'Live') return
    if (!mapRef.current || !mapRef.current.getContainer()) return
    if (!mapRef.current.getContainer().isConnected) return
    if (!mapRef.current._mapPane) return
    if (hasCenteredRef.current) return
    mapRef.current.setView([coords.lat, coords.lon], mapRef.current.getZoom(), {
      animate: false,
    })
    hasCenteredRef.current = true
  }, [coords.lat, coords.lon, locationStatus])

  useEffect(() => {
    if (!currentMarkerRef.current) return
    currentMarkerRef.current.setLatLng([coords.lat, coords.lon])
  }, [coords.lat, coords.lon])

  const handleCenterDocking = () => {
    if (!mapRef.current) return
    mapRef.current.setView([coords.lat, coords.lon], mapRef.current.getZoom(), {
      animate: true,
    })
  }

  useEffect(() => {
    if (!mapRef.current) return
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isMaximized])

  useEffect(() => {
    if (!markersRef.current) return
    markersRef.current.clearLayers()
    waypoints.forEach((point, index) => {
      const sequence = point.sequence_order || index + 1
      L.marker([point.latitude, point.longitude], {
        icon: waypointIcon(sequence),
      }).addTo(markersRef.current)
    })
    if (pathRef.current) {
      const latlngs = waypoints.map((point) => [
        point.latitude,
        point.longitude,
      ])
      pathRef.current.setLatLngs(latlngs)
    }
    if (firstLegRef.current) {
      if (waypoints.length > 0) {
        const first = waypoints[0]
        firstLegRef.current.setLatLngs([
          [coords.lat, coords.lon],
          [first.latitude, first.longitude],
        ])
      } else {
        firstLegRef.current.setLatLngs([])
      }
    }
  }, [waypoints, waypointIcon, coords.lat, coords.lon])

  return (
    <Panel
      title="Map"
      titleId="panel-map"
      className={className}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCenterDocking}
            aria-label="Center on docking"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>
          <MaximizeButton
            isMaximized={isMaximized}
            onToggle={onToggleMaximize}
            label="map"
          />
        </div>
      }
    >
      <div className="relative flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950 text-slate-100 min-[900px]:min-h-0">
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1000] flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/70 bg-slate-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
          <span>Lat: {coords.lat.toFixed(6)}</span>
          <span>Lon: {coords.lon.toFixed(6)}</span>
          <span>Location: {locationStatus}</span>
          <span>{canAddWaypoints ? 'Planning: On' : 'Planning: Off'}</span>
        </div>
        <div
          ref={mapContainerRef}
          role="img"
          aria-label="OpenStreetMap interactive map"
          className="h-full w-full"
        />
      </div>
    </Panel>
  )
}

export default MapPanel
