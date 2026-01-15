const parseCoordinate = (value) => {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getEnvCoords = () => {
  const lat = parseCoordinate(import.meta.env.VITE_CURRENT_LAT)
  const lon = parseCoordinate(import.meta.env.VITE_CURRENT_LON)
  if (lat === null || lon === null) return null
  return { lat, lon }
}

export { getEnvCoords }
