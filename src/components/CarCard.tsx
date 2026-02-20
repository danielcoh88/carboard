import { Link } from 'react-router-dom';
import { Car, getProfilePhoto, getCarTitle, formatPrice, formatMileage, ENGINE_TYPE_LABELS, TRANSMISSION_LABELS } from '../types/car';
import StatusBadge from './StatusBadge';
import RatingStars from './RatingStars';

interface Props {
  car: Car;
  viewMode: 'grid' | 'list';
}

export default function CarCard({ car, viewMode }: Props) {
  const profilePhoto = getProfilePhoto(car);
  const title = getCarTitle(car);

  if (viewMode === 'list') {
    return (
      <Link to={`/car/${car.id}`} className="car-card-list">
        <div className="car-card-list-photo">
          {profilePhoto ? (
            <img src={profilePhoto} alt={title} />
          ) : (
            <div className="no-photo-sm">🚗</div>
          )}
        </div>
        <div className="car-card-list-info">
          <div className="car-card-list-title">{title}</div>
          <div className="car-card-list-details">
            {car.mileage !== null && <span>{formatMileage(car.mileage)}</span>}
            {car.engineType && <span>{ENGINE_TYPE_LABELS[car.engineType]}</span>}
            {car.transmission && <span>{TRANSMISSION_LABELS[car.transmission]}</span>}
            {car.city && <span>{car.city}</span>}
          </div>
        </div>
        <div className="car-card-list-meta">
          {car.price !== null && <div className="car-card-list-price">{formatPrice(car.price)}</div>}
          <StatusBadge status={car.status} />
          {car.rating > 0 && <RatingStars rating={car.rating} size="sm" />}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/car/${car.id}`} className="car-card">
      <div className="car-card-photo">
        {profilePhoto ? (
          <img src={profilePhoto} alt={title} />
        ) : (
          <div className="no-photo">🚗</div>
        )}
        <div className="car-card-badges">
          <StatusBadge status={car.status} />
        </div>
        {car.photos.length > 1 && (
          <div className="car-card-photo-count">📷 {car.photos.length}</div>
        )}
      </div>
      <div className="car-card-body">
        <h3 className="car-card-title">{title}</h3>
        <div className="car-card-specs">
          {car.mileage !== null && (
            <span className="spec">{formatMileage(car.mileage)}</span>
          )}
          {car.engineType && (
            <span className="spec">{ENGINE_TYPE_LABELS[car.engineType]}</span>
          )}
          {car.transmission && (
            <span className="spec">{TRANSMISSION_LABELS[car.transmission]}</span>
          )}
          {car.previousOwners !== null && (
            <span className="spec">יד {car.previousOwners}</span>
          )}
        </div>
        {car.city && <div className="car-card-city">📍 {car.city}</div>}
        <div className="car-card-footer">
          {car.price !== null ? (
            <span className="car-card-price">{formatPrice(car.price)}</span>
          ) : (
            <span />
          )}
          {car.rating > 0 && <RatingStars rating={car.rating} size="sm" />}
        </div>
        {car.notes.length > 0 && (
          <div className="car-card-notes-indicator">
            💬 {car.notes.length} הערות
          </div>
        )}
      </div>
    </Link>
  );
}
