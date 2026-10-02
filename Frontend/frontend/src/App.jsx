import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import { DetailsPanel } from './components/DetailsPanel'
import { GlobeScene } from './components/GlobeScene'
import { SatellitePanel } from './components/SatellitePanel'
import { SceneControls } from './components/SceneControls'
import { TopBar } from './components/TopBar'
import { useOrbitTelemetry } from './hooks/useOrbitTelemetry'
import { useSatelliteCatalog } from './hooks/useSatelliteCatalog'
import './App.css'

export default function App() {
  const appRef = useRef(null)
  const { satellites, source, loading, error } = useSatelliteCatalog()
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [isRunning, setIsRunning] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const [resetRequest, setResetRequest] = useState(0)
  const { currentTime, snapshots } = useOrbitTelemetry(satellites, isRunning)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const animation = animate(
      appRef.current.querySelectorAll('.topbar, .satellite-panel, .details-panel, .scene-controls'),
      {
        opacity: { from: 0 },
        y: { from: 16 },
        delay: stagger(80),
        duration: 720,
        ease: 'outExpo',
      },
    )

    return () => animation.cancel()
  }, [])

  const visibleSatellites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return satellites.filter((satellite) => {
      const matchesCategory = category === 'all' || satellite.category === category
      const matchesQuery = !normalizedQuery
        || satellite.name.toLowerCase().includes(normalizedQuery)
        || satellite.id.includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [satellites, category, query])

  const activeSelectedId = selectedId ?? satellites[0]?.id ?? null
  const selectedSatellite = satellites.find(({ id }) => id === activeSelectedId) ?? null
  const selectedSnapshot = snapshots.get(activeSelectedId)

  function handleSelect(id) {
    setSelectedId(id)
    setFocusRequest((value) => value + 1)
    setPanelOpen(false)
  }

  return (
    <div className="app-shell" ref={appRef}>
      <a className="skip-link" href="#satellite-catalog">Skip to satellite catalog</a>

      <GlobeScene
        satellites={satellites}
        snapshots={snapshots}
        selectedId={activeSelectedId}
        focusRequest={focusRequest}
        resetRequest={resetRequest}
        onSelect={handleSelect}
      />

      <TopBar
        currentTime={currentTime}
        isOnline={!error}
        source={source}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((value) => !value)}
      />

      <div id="satellite-catalog">
        <SatellitePanel
          satellites={satellites}
          visibleSatellites={visibleSatellites}
          selectedId={activeSelectedId}
          category={category}
          query={query}
          loading={loading}
          panelOpen={panelOpen}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />
      </div>

      <DetailsPanel
        satellite={selectedSatellite}
        snapshot={selectedSnapshot}
        onFocus={() => setFocusRequest((value) => value + 1)}
      />

      <SceneControls
        isRunning={isRunning}
        satellite={selectedSatellite}
        snapshot={selectedSnapshot}
        onToggleRunning={() => setIsRunning((value) => !value)}
        onResetView={() => setResetRequest((value) => value + 1)}
      />

      <div className="edge-coordinate edge-coordinate-north">90° N</div>
      <div className="edge-coordinate edge-coordinate-east">180° E</div>
    </div>
  )
}
