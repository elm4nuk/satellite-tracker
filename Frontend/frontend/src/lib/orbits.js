import * as satellite from 'satellite.js'

const CATEGORY_RULES = [
  { id: 'station', label: 'Stations', color: '#f6c85f', terms: ['ISS', 'TIANGONG', 'CSS'] },
  { id: 'starlink', label: 'Starlink', color: '#64d9ff', terms: ['STARLINK'] },
  { id: 'weather', label: 'Weather', color: '#69e6a6', terms: ['NOAA', 'GOES', 'METEOR', 'HIMAWARI'] },
  { id: 'navigation', label: 'Navigation', color: '#ff9f6e', terms: ['GPS', 'GLONASS', 'GALILEO', 'BEIDOU'] },
  { id: 'science', label: 'Science', color: '#b69cff', terms: ['HUBBLE', 'TERRA', 'AQUA', 'LANDSAT'] },
]

export const CATEGORY_META = [
  ...CATEGORY_RULES.map(({ id, label, color }) => ({ id, label, color })),
  { id: 'other', label: 'Other', color: '#d8e4ec' },
]

export function getCategory(name) {
  const normalizedName = name.toUpperCase()
  return CATEGORY_RULES.find(({ terms }) => terms.some((term) => normalizedName.includes(term)))?.id ?? 'other'
}
export function getCategoryMeta(category) {
  return CATEGORY_META.find(({ id }) => id === category) ?? CATEGORY_META.at(-1)
}

export function parseTle(rawText, limit = 160) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const records = []

  for (let index = 0; index < lines.length - 2 && records.length < limit; index += 1) {
    const name = lines[index]
    const line1 = lines[index + 1]
    const line2 = lines[index + 2]

    if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
      try {
        const satrec = satellite.twoline2satrec(line1, line2)
        const id = line1.slice(2, 7).trim() || `${name}-${index}`
        records.push({
          id,
          name,
          line1,
          line2,
          satrec,
          category: getCategory(name),
        })
        index += 2
      } catch {
        // Skip malformed records while keeping the rest of the feed usable.
      }
    }
  }

  return records
}

export function propagateSatellite(record, date) {
  try {
    const result = satellite.propagate(record.satrec, date)
    if (!result.position) return null

    const gmst = satellite.gstime(date)
    const geodetic = satellite.eciToGeodetic(result.position, gmst)
    const velocity = result.velocity
      ? Math.hypot(result.velocity.x, result.velocity.y, result.velocity.z)
      : 0

    return {
      latitude: satellite.degreesLat(geodetic.latitude),
      longitude: satellite.degreesLong(geodetic.longitude),
      altitude: geodetic.height,
      velocity,
    }
  } catch {
    return null
  }
}

export function buildOrbitPath(record, startDate, durationMinutes = 105, stepMinutes = 2) {
  const positions = []

  for (let minute = 0; minute <= durationMinutes; minute += stepMinutes) {
    const sample = propagateSatellite(record, new Date(startDate.getTime() + minute * 60_000))
    if (sample && sample.altitude > 0) positions.push(sample)
  }

  return positions
}

export function formatCoordinate(value, positive, negative) {
  if (!Number.isFinite(value)) return '—'
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`
}

export function formatNumber(value, decimals = 0) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
