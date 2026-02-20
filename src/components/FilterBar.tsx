import { useCars, SortField } from '../store/CarContext';
import {
  COMMON_MAKES,
  ENGINE_TYPE_LABELS,
  TRANSMISSION_LABELS,
  STATUS_LABELS,
  CarStatus,
} from '../types/car';

export default function FilterBar() {
  const { state, dispatch, filteredCars } = useCars();
  const { filters, sortField, sortOrder, viewMode } = state;
  const allMakes = Array.from(new Set(state.cars.map(c => c.make).filter(Boolean)));
  const makeOptions = Array.from(new Set([...allMakes, ...COMMON_MAKES])).sort();

  const hasActiveFilters =
    filters.search || filters.make || filters.yearFrom || filters.yearTo ||
    filters.priceFrom || filters.priceTo || filters.status || filters.engineType ||
    filters.transmission;

  return (
    <div className="filter-bar">
      <div className="filter-row filter-row-main">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="חיפוש חופשי..."
            value={filters.search}
            onChange={e => dispatch({ type: 'SET_FILTERS', filters: { search: e.target.value } })}
            className="search-input"
          />
          {filters.search && (
            <button
              className="search-clear"
              onClick={() => dispatch({ type: 'SET_FILTERS', filters: { search: '' } })}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split('-') as [SortField, 'asc' | 'desc'];
              dispatch({ type: 'SET_SORT', field, order });
            }}
            className="filter-select"
          >
            <option value="createdAt-desc">תאריך הוספה (חדש)</option>
            <option value="createdAt-asc">תאריך הוספה (ישן)</option>
            <option value="updatedAt-desc">עודכן לאחרונה</option>
            <option value="price-asc">מחיר (נמוך לגבוה)</option>
            <option value="price-desc">מחיר (גבוה לנמוך)</option>
            <option value="year-desc">שנה (חדש)</option>
            <option value="year-asc">שנה (ישן)</option>
            <option value="mileage-asc">ק"מ (נמוך לגבוה)</option>
            <option value="mileage-desc">ק"מ (גבוה לנמוך)</option>
            <option value="rating-desc">דירוג (גבוה)</option>
          </select>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'grid' })}
              title="תצוגת כרטיסים"
            >
              ▦
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'list' })}
              title="תצוגת רשימה"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="filter-row filter-row-fields">
        <select
          value={filters.make}
          onChange={e => dispatch({ type: 'SET_FILTERS', filters: { make: e.target.value } })}
          className="filter-select"
        >
          <option value="">כל היצרנים</option>
          {makeOptions.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={e => dispatch({ type: 'SET_FILTERS', filters: { status: e.target.value as CarStatus | '' } })}
          className="filter-select"
        >
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filters.engineType}
          onChange={e => dispatch({ type: 'SET_FILTERS', filters: { engineType: e.target.value } })}
          className="filter-select"
        >
          <option value="">סוג מנוע</option>
          {Object.entries(ENGINE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filters.transmission}
          onChange={e => dispatch({ type: 'SET_FILTERS', filters: { transmission: e.target.value } })}
          className="filter-select"
        >
          <option value="">תיבת הילוכים</option>
          {Object.entries(TRANSMISSION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="filter-range">
          <input
            type="number"
            placeholder="שנה מ..."
            value={filters.yearFrom ?? ''}
            onChange={e => dispatch({ type: 'SET_FILTERS', filters: { yearFrom: e.target.value ? Number(e.target.value) : null } })}
            className="filter-input filter-input-sm"
          />
          <span className="range-sep">-</span>
          <input
            type="number"
            placeholder="עד..."
            value={filters.yearTo ?? ''}
            onChange={e => dispatch({ type: 'SET_FILTERS', filters: { yearTo: e.target.value ? Number(e.target.value) : null } })}
            className="filter-input filter-input-sm"
          />
        </div>

        <div className="filter-range">
          <input
            type="number"
            placeholder="מחיר מ..."
            value={filters.priceFrom ?? ''}
            onChange={e => dispatch({ type: 'SET_FILTERS', filters: { priceFrom: e.target.value ? Number(e.target.value) : null } })}
            className="filter-input filter-input-sm"
          />
          <span className="range-sep">-</span>
          <input
            type="number"
            placeholder="עד..."
            value={filters.priceTo ?? ''}
            onChange={e => dispatch({ type: 'SET_FILTERS', filters: { priceTo: e.target.value ? Number(e.target.value) : null } })}
            className="filter-input filter-input-sm"
          />
        </div>

        {hasActiveFilters && (
          <button
            className="btn btn-text"
            onClick={() => dispatch({ type: 'RESET_FILTERS' })}
          >
            ✕ נקה סינון
          </button>
        )}
      </div>

      <div className="filter-summary">
        {filteredCars.length} רכבים{state.cars.length !== filteredCars.length && ` מתוך ${state.cars.length}`}
      </div>
    </div>
  );
}
