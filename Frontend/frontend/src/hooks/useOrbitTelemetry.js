import { useEffect, useMemo, useState } from 'react'
import { propagateSatellite } from '../lib/orbits'

function calculateSnapshots(satellites, time) {
  return new Map(
    satellites
      .map((record) => [record.id, propagateSatellite(record, time)])
      .filter(([, snapshot]) => snapshot?.altitude > 0),
  )
}

export function useOrbitTelemetry(satellites, isRunning) {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    if (!isRunning) return undefined
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 1_000)
    return () => window.clearInterval(intervalId)
  }, [isRunning])

  const snapshots = useMemo(
    () => calculateSnapshots(satellites, currentTime),
    [satellites, currentTime],
  )

  return { currentTime, snapshots }
}
