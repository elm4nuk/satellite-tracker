import { formatNumber, getCategoryMeta } from '../lib/orbits'
import { Icon } from './Icon'

export function SceneControls({ isRunning, satellite, snapshot, onToggleRunning, onResetView }) {
  const meta = satellite ? getCategoryMeta(satellite.category) : null

  return (
    <div className="scene-controls glass-panel">
      <button className="playback-button" type="button" onClick={onToggleRunning}>
        <Icon name={isRunning ? 'pause' : 'play'} size={15} />
        <span>{isRunning ? 'Live' : 'Paused'}</span>
      </button>

      <div className="control-divider" />

      <div className="compact-object">
        <span className="compact-dot" style={{ '--sat-color': meta?.color ?? '#d8e4ec' }} />
        <div>
          <strong>{satellite?.name ?? 'No object selected'}</strong>
          <span>{formatNumber(snapshot?.altitude)} km · {formatNumber(snapshot?.velocity, 2)} km/s</span>
        </div>
      </div>

      <button className="reset-view" type="button" onClick={onResetView}>
        <Icon name="globe" size={16} />
        <span>Global view</span>
      </button>
    </div>
  )
}
