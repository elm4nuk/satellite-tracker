import { Icon } from './Icon'

function formatUtc(date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date)
}
export function TopBar({ currentTime, isOnline, source, onTogglePanel, panelOpen }) {
  return (
    <header className="topbar glass-panel">
      <div className="brand" aria-label="Orbital satellite tracker">
        <span className="brand-mark"><Icon name="satellite" size={21} /></span>
        <span className="brand-copy">
          <strong>ORBITAL</strong>
          <span>Mission control</span>
        </span>
      </div>

      <div className="topbar-status" role="status">
        <span className={`status-dot ${isOnline ? 'is-online' : ''}`} />
        <span className="status-label">{isOnline ? 'Live telemetry' : 'Local telemetry'}</span>
        <span className="status-source">{source}</span>
      </div>

      <div className="utc-clock">
        <Icon name="clock" size={15} />
        <span className="utc-time">{formatUtc(currentTime)}</span>
        <span className="utc-label">UTC</span>
      </div>

      <button
        className="icon-button mobile-panel-toggle"
        type="button"
        aria-label={panelOpen ? 'Close satellite catalog' : 'Open satellite catalog'}
        aria-expanded={panelOpen}
        onClick={onTogglePanel}
      >
        <Icon name={panelOpen ? 'close' : 'menu'} />
      </button>
    </header>
  )
}
