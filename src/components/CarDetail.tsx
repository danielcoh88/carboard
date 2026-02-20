import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCars } from '../store/CarContext';
import {
  Car,
  CarStatus,
  getCarTitle,
  formatPrice,
  formatMileage,
  ENGINE_TYPE_LABELS,
  TRANSMISSION_LABELS,
  STATUS_LABELS,
} from '../types/car';
import PhotoManager from './PhotoManager';
import NotesList from './NotesList';
import StatusBadge from './StatusBadge';
import RatingStars from './RatingStars';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, updateCar, removeCar } = useCars();
  const [car, setCar] = useState<Car | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const found = state.cars.find(c => c.id === id);
    if (found) setCar(found);
  }, [id, state.cars]);

  if (state.loading) {
    return <div className="loading-state"><div className="spinner" /><p>טוען...</p></div>;
  }

  if (!car) {
    return (
      <div className="empty-state">
        <h2>הרכב לא נמצא</h2>
        <Link to="/" className="btn btn-primary">חזרה לרשימה</Link>
      </div>
    );
  }

  const title = getCarTitle(car);

  async function handleStatusChange(status: CarStatus) {
    if (!car) return;
    const updated = { ...car, status };
    await updateCar(updated);
    setCar(updated);
  }

  async function handleRatingChange(rating: number) {
    if (!car) return;
    const updated = { ...car, rating };
    await updateCar(updated);
    setCar(updated);
  }

  async function handleNotesChange(notes: Car['notes']) {
    if (!car) return;
    const updated = { ...car, notes };
    await updateCar(updated);
    setCar(updated);
  }

  async function handlePhotosChange(photos: Car['photos'], profilePhotoId: string) {
    if (!car) return;
    const updated = { ...car, photos, profilePhotoId };
    await updateCar(updated);
    setCar(updated);
  }

  async function handleDelete() {
    if (!car) return;
    await removeCar(car.id);
    navigate('/');
  }

  const infoRows: [string, string][] = [
    ['יצרן', car.make],
    ['דגם', car.model],
    ['תת דגם', car.subModel],
    ['שנה', car.year?.toString() ?? ''],
    ['קילומטראז\'', car.mileage !== null ? formatMileage(car.mileage) : ''],
    ['סוג מנוע', car.engineType ? ENGINE_TYPE_LABELS[car.engineType] : ''],
    ['נפח מנוע', car.engineVolume ? `${car.engineVolume} cc` : ''],
    ['תיבת הילוכים', car.transmission ? TRANSMISSION_LABELS[car.transmission] : ''],
    ['כוח סוס', car.horsepower ? `${car.horsepower} כ"ס` : ''],
    ['צבע', car.color],
    ['יד', car.previousOwners?.toString() ?? ''],
    ['בעלות', car.currentOwnership],
    ['תוקף טסט', car.testDate ? new Date(car.testDate).toLocaleDateString('he-IL') : ''],
    ['מחיר', car.price !== null ? formatPrice(car.price) : ''],
    ['מחיר מקורי', car.originalPrice !== null ? formatPrice(car.originalPrice) : ''],
    ['עיר', car.city],
    ['מוכר', car.sellerName],
    ['טלפון', car.sellerPhone],
  ].filter(([, val]) => val !== '' && val !== undefined) as [string, string][];

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn btn-text" onClick={() => navigate('/')}>→ חזרה לרשימה</button>
        <div className="page-header-actions">
          <Link to={`/car/${car.id}/edit`} className="btn btn-secondary">✏️ עריכה</Link>
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>🗑️ מחיקה</button>
        </div>
      </div>

      <div className="car-detail">
        <div className="car-detail-header">
          <h1>{title}</h1>
          <div className="car-detail-header-meta">
            <StatusBadge status={car.status} size="md" />
            <RatingStars rating={car.rating} onChange={handleRatingChange} size="md" />
          </div>
        </div>

        {/* Quick status change */}
        <div className="status-quick-change">
          <span className="status-label">שנה סטטוס:</span>
          <div className="status-buttons">
            {(Object.entries(STATUS_LABELS) as [CarStatus, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`status-btn ${car.status === key ? 'active' : ''}`}
                style={{ borderColor: car.status === key ? 'var(--primary)' : undefined }}
                onClick={() => handleStatusChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Price highlight */}
        {car.price !== null && (
          <div className="price-highlight">
            <span className="price-main">{formatPrice(car.price)}</span>
            {car.originalPrice !== null && car.originalPrice > car.price && (
              <span className="price-original">{formatPrice(car.originalPrice)}</span>
            )}
          </div>
        )}

        {/* Photos */}
        <section className="detail-section">
          <h2>תמונות ({car.photos.length})</h2>
          <PhotoManager
            photos={car.photos}
            profilePhotoId={car.profilePhotoId}
            onChange={handlePhotosChange}
          />
        </section>

        {/* Info table */}
        <section className="detail-section">
          <h2>פרטי הרכב</h2>
          <div className="info-table">
            {infoRows.map(([label, value]) => (
              <div key={label} className="info-row">
                <span className="info-label">{label}</span>
                <span className="info-value">
                  {label === 'טלפון' ? (
                    <a href={`tel:${value}`} dir="ltr">{value}</a>
                  ) : (
                    value
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Source link */}
        {car.sourceUrl && (
          <section className="detail-section">
            <h2>קישור למודעה</h2>
            <a
              href={car.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              🔗 {car.sourceSite || 'פתח מודעה מקורית'}
            </a>
          </section>
        )}

        {/* Notes */}
        <section className="detail-section">
          <h2>הערות ועדכונים ({car.notes.length})</h2>
          <NotesList notes={car.notes} onChange={handleNotesChange} />
        </section>

        {/* Metadata */}
        <div className="car-detail-meta">
          <span>נוסף: {new Date(car.createdAt).toLocaleDateString('he-IL')}</span>
          <span>עודכן: {new Date(car.updatedAt).toLocaleDateString('he-IL')}</span>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>מחיקת רכב</h3>
            <p>האם למחוק את "{title}"? הפעולה לא ניתנת לביטול.</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDelete}>מחק</button>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
