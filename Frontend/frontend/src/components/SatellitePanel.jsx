import { CATEGORY_META, getCategoryMeta } from '../lib/orbits'
import { Icon } from './Icon'

export function SatellitePanel({
  satellites,
  visibleSatellites,
  selectedId,
  category,
  query,
  loading,
  panelOpen,
  onCategoryChange,
  onQueryChange,
  onSelect,
}) {
  return (
    <aside className={`satellite-panel glass-panel ${panelOpen ? 'is-open' : ''}`} aria-label="Satellite catalog">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Object catalog</p>
          <h1>Satellites</h1>
        </div>
        <span className="object-count">{satellites.length}</span>
      </div>

      <label className="search-field">
        <Icon name="search" size={17} />
        <span className="sr-only">Search satellites</span>
        <input
          type="search"
          placeholder="Search by name or NORAD ID"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => onQueryChange('')}>
            <Icon name="close" size={14} />
          </button>
        )}
      </label>

      <div className="category-tabs" role="group" aria-label="Filter by satellite type">
        <button
          className={category === 'all' ? 'is-active' : ''}
          type="button"
          onClick={() => onCategoryChange('all')}
        >
          All
        </button>
        {CATEGORY_META.slice(0, 4).map((item) => (
          <button
            className={category === item.id ? 'is-active' : ''}
            key={item.id}
            type="button"
            onClick={() => onCategoryChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="satellite-list" aria-live="polite">
        {loading && (
          <div className="catalog-state">
            <span className="loader-ring" />
            <p>Acquiring orbital elements…</p>
          </div>
        )}

        {!loading && !visibleSatellites.length && (
          <div className="catalog-state">
            <Icon name="search" size={24} />
            <p>No satellites match this view.</p>
            <button type="button" onClick={() => { onQueryChange(''); onCategoryChange('all') }}>
              Reset filters
            </button>
          </div>
        )}

        {visibleSatellites.map((satellite) => {
          const meta = getCategoryMeta(satellite.category)
          const isSelected = selectedId === satellite.id

          return (
            <button
              className={`satellite-row ${isSelected ? 'is-selected' : ''}`}
              key={satellite.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(satellite.id)}
            >
              <span className="satellite-indicator" style={{ '--sat-color': meta.color }}>
                <span />
              </span>
              <span className="satellite-row-copy">
                <strong>{satellite.name}</strong>
                <span>NORAD {satellite.id} · {meta.label}</span>
              </span>
              <Icon name="chevron" size={15} />
            </button>
          )
        })}
      </div>

      <footer className="panel-footer">
        <span><span className="pulse-dot" /> Tracking {satellites.length} objects</span>
        <span>SGP4</span>
      </footer>
    </aside>
  )
}
