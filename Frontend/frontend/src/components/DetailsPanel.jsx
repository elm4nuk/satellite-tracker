import { formatCoordinate, formatNumber, getCategoryMeta } from '../lib/orbits'
import { Icon } from './Icon'

function Metric({ icon, label, value, unit }) {
  return (
    <div className="metric-card">
      <span className="metric-icon"><Icon name={icon} size={16} /></span>
      <span className="metric-copy">
        <span>{label}</span>
        <strong>{value} <small>{unit}</small></strong>
      </span>
    </div>
  )
}
export function DetailsPanel({ satellite, snapshot, onFocus }) {
  if (!satellite) {
    return (
      <aside className="details-panel glass-panel empty-details">
        <Icon name="satellite" size={28} />
        <p>Select an object to inspect its telemetry.</p>
      </aside>
    )
  }

  const meta = getCategoryMeta(satellite.category)

  return (
    <aside className="details-panel glass-panel" aria-label={`${satellite.name} telemetry`}>
      <div className="details-visual">
        <span className="orbit-ring orbit-ring-one" />
        <span className="orbit-ring orbit-ring-two" />
        <span className="satellite-glyph" style={{ '--sat-color': meta.color }}>
          <Icon name="satellite" size={26} />
        </span>
      </div>

      <p className="eyebrow">Selected object</p>
      <h2>{satellite.name}</h2>
      <div className="object-meta">
        <span style={{ '--sat-color': meta.color }}>{meta.label}</span>
        <span>NORAD {satellite.id}</span>
      </div>

      <div className="telemetry-grid">
        <Metric icon="altitude" label="Altitude" value={formatNumber(snapshot?.altitude, 0)} unit="km" />
        <Metric icon="speed" label="Velocity" value={formatNumber(snapshot?.velocity, 2)} unit="km/s" />
      </div>

      <div className="coordinate-block">
        <div>
          <span>Latitude</span>
          <strong>{formatCoordinate(snapshot?.latitude, 'N', 'S')}</strong>
        </div>
        <div>
          <span>Longitude</span>
          <strong>{formatCoordinate(snapshot?.longitude, 'E', 'W')}</strong>
        </div>
      </div>

      <div className="tle-preview">
        <div className="tle-heading">
          <span>Orbital elements</span>
          <span className="live-label">TLE</span>
        </div>
        <code>{satellite.line1}</code>
        <code>{satellite.line2}</code>
      </div>

      <button className="focus-button" type="button" onClick={onFocus}>
        <Icon name="focus" size={17} />
        Focus on object
      </button>
    </aside>
  )
}
