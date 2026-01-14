import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import Panel from '../ui/Panel.jsx'

function MapPanel({ className, waypoints = [], onAddWaypoint, canAddWaypoints }) {
  const [coords, setCoords] = useState({ lat: -6.2, lon: 106.816666 })
  const [locationStatus, setLocationStatus] = useState('Detecting...')
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const markersRef = useRef(null)
  const currentMarkerRef = useRef(null)
  const pathRef = useRef(null)
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

  useEffect(() => {
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
  }, [])

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
    }).setView([coords.lat, coords.lon], 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    currentMarkerRef.current = L.circleMarker([coords.lat, coords.lon], {
      radius: 6,
      color: '#22d3ee',
      weight: 2,
      fillColor: '#0ea5e9',
      fillOpacity: 0.8,
    }).addTo(map)
    pathRef.current = L.polyline([], {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.8,
    }).addTo(map)

    map.on('click', (event) => {
      if (!addWaypointRef.current || !canAddWaypointsRef.current) return
      const { lat, lng } = event.latlng
      addWaypointRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
    })

    mapRef.current = map

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markersRef.current = null
      currentMarkerRef.current = null
      pathRef.current = null
      hasCenteredRef.current = false
    }
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
  }, [waypoints, waypointIcon])

  return (
    <Panel
      title="Map"
      titleId="panel-map"
      className={className}
      actions={null}
    >
      {/* Replace with a fully interactive OpenStreetMap integration if needed */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950 text-slate-100">
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
