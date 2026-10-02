import { useEffect, useState } from 'react'
import { FALLBACK_TLE } from '../data/fallbackTle'
import { parseTle } from '../lib/orbits'

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/tle`

export function useSatelliteCatalog() {
  const [state, setState] = useState({
    satellites: [],
    source: 'Connecting',
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 7_000)

    async function loadCatalog() {
      try {
        const response = await fetch(API_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`TLE service returned ${response.status}`)

        const payload = await response.json()
        if (!payload.tle) throw new Error(payload.error || 'TLE feed is empty')

        const satellites = parseTle(payload.tle)
        if (!satellites.length) throw new Error('No valid TLE records found')

        setState({ satellites, source: 'CelesTrak live feed', loading: false, error: null })
      } catch (error) {
        if (controller.signal.aborted && error.name === 'AbortError') {
          setState({
            satellites: parseTle(FALLBACK_TLE),
            source: 'Onboard catalog',
            loading: false,
            error: 'Live feed timed out',
          })
          return
        }

        setState({
          satellites: parseTle(FALLBACK_TLE),
          source: 'Onboard catalog',
          loading: false,
          error: 'Live feed unavailable',
        })
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    loadCatalog()
    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return state
}
