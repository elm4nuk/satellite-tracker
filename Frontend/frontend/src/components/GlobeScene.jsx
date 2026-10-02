import { useEffect, useRef } from 'react'
import { buildOrbitPath, getCategoryMeta } from '../lib/orbits'

function getGlobalCameraView(Cesium) {
  const destination = Cesium.Cartesian3.fromDegrees(18, 16, 18_000_000)
  const direction = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.negate(destination, new Cesium.Cartesian3()),
    new Cesium.Cartesian3(),
  )

  return {
    destination,
    orientation: {
      direction,
      up: Cesium.Cartesian3.UNIT_Z,
    },
  }
}

function focusCamera(viewer, Cesium, snapshot, duration = 1.25) {
  const targetPosition = Cesium.Cartesian3.fromDegrees(
    snapshot.longitude,
    snapshot.latitude,
    snapshot.altitude * 1000,
  )
  const focusDistance = Math.min(
    24_000_000,
    Math.max(14_000_000, snapshot.altitude * 1_200),
  )

  viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(targetPosition, 1), {
    duration,
    offset: new Cesium.HeadingPitchRange(0, -Math.PI / 2, focusDistance),
  })
}

export function GlobeScene({
  satellites,
  snapshots,
  selectedId,
  focusRequest,
  resetRequest,
  onSelect,
}) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const entitiesRef = useRef(new Map())
  const orbitEntityRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const snapshotsRef = useRef(snapshots)
  const initialFocusDoneRef = useRef(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    snapshotsRef.current = snapshots
  }, [snapshots])

  useEffect(() => {
    const Cesium = window.Cesium
    if (!containerRef.current || !Cesium) return undefined

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    })
    const trackedEntities = new Map()
    entitiesRef.current = trackedEntities

    const baseLayer = viewer.imageryLayers.addImageryProvider(new Cesium.OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/',
    }))
    baseLayer.brightness = 0.52
    baseLayer.contrast = 1.24
    baseLayer.saturation = 0.42
    baseLayer.gamma = 0.88
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#02070a')
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#123943')
    viewer.scene.globe.enableLighting = true
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.scene.skyAtmosphere.hueShift = -0.08
    viewer.scene.skyAtmosphere.saturationShift = -0.25
    viewer.scene.skyAtmosphere.brightnessShift = -0.22
    viewer.scene.fog.enabled = true
    viewer.scene.fog.density = 0.00012
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 250_000
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 40_000_000
    viewer.camera.setView(getGlobalCameraView(Cesium))

    const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    clickHandler.setInputAction((event) => {
      const picked = viewer.scene.pick(event.position)
      const catalogId = picked?.id?.properties?.catalogId?.getValue()
      if (catalogId) onSelectRef.current(catalogId)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer

    return () => {
      clickHandler.destroy()
      trackedEntities.clear()
      if (!viewer.isDestroyed()) viewer.destroy()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const Cesium = window.Cesium
    const viewer = viewerRef.current
    if (!Cesium || !viewer) return

    const activeIds = new Set(satellites.map(({ id }) => id))

    for (const [id, entity] of entitiesRef.current) {
      if (!activeIds.has(id)) {
        viewer.entities.remove(entity)
        entitiesRef.current.delete(id)
      }
    }

    satellites.forEach((record) => {
      if (entitiesRef.current.has(record.id)) return
      const meta = getCategoryMeta(record.category)
      const position = snapshots.get(record.id)
      const entity = viewer.entities.add({
        name: record.name,
        position: position
          ? Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.altitude * 1000)
          : undefined,
        properties: { catalogId: record.id },
        point: {
          pixelSize: record.name.includes('ISS') ? 10 : 6,
          color: Cesium.Color.fromCssColorString(meta.color),
          outlineColor: Cesium.Color.fromCssColorString('#f4fbff').withAlpha(0.65),
          outlineWidth: 1,
          scaleByDistance: new Cesium.NearFarScalar(500_000, 1.4, 30_000_000, 0.72),
        },
        label: {
          text: record.name,
          show: record.id === selectedId,
          font: '600 12px Inter, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#f4fbff'),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#071014').withAlpha(0.82),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          pixelOffset: new Cesium.Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      entitiesRef.current.set(record.id, entity)
    })

    const initialSnapshot = snapshots.get(selectedId)
    if (!initialFocusDoneRef.current && initialSnapshot) {
      initialFocusDoneRef.current = true
      focusCamera(viewer, Cesium, initialSnapshot)
    }
  }, [satellites, snapshots, selectedId])

  useEffect(() => {
    const Cesium = window.Cesium
    if (!Cesium) return

    snapshots.forEach((snapshot, id) => {
      const entity = entitiesRef.current.get(id)
      if (entity) {
        entity.position = Cesium.Cartesian3.fromDegrees(
          snapshot.longitude,
          snapshot.latitude,
          snapshot.altitude * 1000,
        )
      }
    })
  }, [snapshots])

  useEffect(() => {
    const Cesium = window.Cesium
    const viewer = viewerRef.current
    if (!Cesium || !viewer || !selectedId) return

    entitiesRef.current.forEach((entity, id) => {
      entity.label.show = id === selectedId
      entity.point.pixelSize = id === selectedId ? 11 : 6
    })

    const record = satellites.find(({ id }) => id === selectedId)
    const entity = entitiesRef.current.get(selectedId)
    const snapshot = snapshotsRef.current.get(selectedId)
    if (!record || !entity || !snapshot) return

    if (orbitEntityRef.current) viewer.entities.remove(orbitEntityRef.current)
    const meta = getCategoryMeta(record.category)
    const path = buildOrbitPath(record, new Date()).map((point) => (
      Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.altitude * 1000)
    ))

    orbitEntityRef.current = viewer.entities.add({
      polyline: {
        positions: path,
        width: 1.5,
        material: Cesium.Color.fromCssColorString(meta.color).withAlpha(0.62),
        arcType: Cesium.ArcType.NONE,
      },
    })

    if (focusRequest === 0) return

    focusCamera(viewer, Cesium, snapshot)
  }, [focusRequest, satellites, selectedId])

  useEffect(() => {
    const Cesium = window.Cesium
    const viewer = viewerRef.current
    if (!Cesium || !viewer || resetRequest === 0) return

    viewer.flyTo(viewer.entities, {
      duration: 1.3,
      offset: new Cesium.HeadingPitchRange(0, -0.55, 22_000_000),
    })
  }, [resetRequest])

  return (
    <main className="globe-stage" aria-label="Interactive 3D globe">
      <div className="globe-canvas" ref={containerRef} />
      <div className="scene-vignette" />
      <div className="coordinate-grid" />
      <div className="scene-label scene-label-left">
        <span>EARTH OBSERVATION</span>
        <strong>REAL-TIME ORBITAL VIEW</strong>
      </div>
      <div className="scene-label scene-label-right">
        <span>REFERENCE</span>
        <strong>ECI / WGS 84</strong>
      </div>
    </main>
  )
}
