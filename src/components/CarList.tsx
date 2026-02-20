import { useCars } from '../store/CarContext';
import CarCard from './CarCard';
import FilterBar from './FilterBar';

export default function CarList() {
  const { state, filteredCars } = useCars();

  if (state.loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>טוען רכבים...</p>
      </div>
    );
  }

  return (
    <div className="car-list-page">
      <FilterBar />
      {filteredCars.length === 0 ? (
        <div className="empty-state">
          {state.cars.length === 0 ? (
            <>
              <div className="empty-icon">🚗</div>
              <h2>עדיין אין רכבים</h2>
              <p>התחל להוסיף רכבים שמצאת אונליין כדי לעקוב אחריהם</p>
            </>
          ) : (
            <>
              <div className="empty-icon">🔍</div>
              <h2>לא נמצאו רכבים</h2>
              <p>נסה לשנות את הסינון</p>
            </>
          )}
        </div>
      ) : (
        <div className={`car-${state.viewMode}`}>
          {filteredCars.map(car => (
            <CarCard key={car.id} car={car} viewMode={state.viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
