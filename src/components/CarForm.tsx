import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCars } from '../store/CarContext';
import {
  Car,
  CarStatus,
  EngineType,
  Transmission,
  createEmptyCar,
  generateId,
  COMMON_MAKES,
  COMMON_COLORS,
  ENGINE_TYPE_LABELS,
  TRANSMISSION_LABELS,
  STATUS_LABELS,
} from '../types/car';
import PhotoManager from './PhotoManager';
import NotesList from './NotesList';
import RatingStars from './RatingStars';

export default function CarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addCar, updateCar } = useCars();
  const isEdit = !!id;

  const [form, setForm] = useState(createEmptyCar());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const car = state.cars.find(c => c.id === id);
      if (car) {
        setForm({
          make: car.make,
          model: car.model,
          subModel: car.subModel,
          year: car.year,
          mileage: car.mileage,
          engineType: car.engineType,
          engineVolume: car.engineVolume,
          transmission: car.transmission,
          horsepower: car.horsepower,
          color: car.color,
          previousOwners: car.previousOwners,
          currentOwnership: car.currentOwnership,
          testDate: car.testDate,
          price: car.price,
          originalPrice: car.originalPrice,
          city: car.city,
          sellerName: car.sellerName,
          sellerPhone: car.sellerPhone,
          sourceUrl: car.sourceUrl,
          sourceSite: car.sourceSite,
          status: car.status,
          rating: car.rating,
          photos: car.photos,
          profilePhotoId: car.profilePhotoId,
          notes: car.notes,
        });
      }
    }
  }, [id, isEdit, state.cars]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (isEdit) {
        const existing = state.cars.find(c => c.id === id)!;
        const updated: Car = {
          ...existing,
          ...form,
          updatedAt: now,
        };
        await updateCar(updated);
        navigate(`/car/${id}`);
      } else {
        const newCar: Car = {
          ...form,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        await addCar(newCar);
        navigate(`/car/${newCar.id}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn btn-text" onClick={() => navigate(-1)}>→ חזרה</button>
        <h1>{isEdit ? 'עריכת רכב' : 'הוספת רכב חדש'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="car-form">
        {/* Basic Info */}
        <section className="form-section">
          <h2 className="form-section-title">פרטים בסיסיים</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>יצרן *</label>
              <input
                list="makes-list"
                value={form.make}
                onChange={e => updateField('make', e.target.value)}
                placeholder="בחר או הקלד יצרן"
                required
              />
              <datalist id="makes-list">
                {COMMON_MAKES.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>

            <div className="form-field">
              <label>דגם *</label>
              <input
                value={form.model}
                onChange={e => updateField('model', e.target.value)}
                placeholder="לדוגמה: קורולה"
                required
              />
            </div>

            <div className="form-field">
              <label>תת דגם / גימור</label>
              <input
                value={form.subModel}
                onChange={e => updateField('subModel', e.target.value)}
                placeholder="לדוגמה: Comfort"
              />
            </div>

            <div className="form-field">
              <label>שנת ייצור</label>
              <input
                type="number"
                value={form.year ?? ''}
                onChange={e => updateField('year', e.target.value ? Number(e.target.value) : null)}
                placeholder="2020"
                min={1990}
                max={2030}
              />
            </div>

            <div className="form-field">
              <label>צבע</label>
              <input
                list="colors-list"
                value={form.color}
                onChange={e => updateField('color', e.target.value)}
                placeholder="בחר צבע"
              />
              <datalist id="colors-list">
                {COMMON_COLORS.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
        </section>

        {/* Technical */}
        <section className="form-section">
          <h2 className="form-section-title">מפרט טכני</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>קילומטראז'</label>
              <input
                type="number"
                value={form.mileage ?? ''}
                onChange={e => updateField('mileage', e.target.value ? Number(e.target.value) : null)}
                placeholder='ק"מ'
                min={0}
              />
            </div>

            <div className="form-field">
              <label>סוג מנוע</label>
              <select
                value={form.engineType}
                onChange={e => updateField('engineType', e.target.value as EngineType)}
              >
                <option value="">בחר...</option>
                {Object.entries(ENGINE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>נפח מנוע (cc)</label>
              <input
                type="number"
                value={form.engineVolume ?? ''}
                onChange={e => updateField('engineVolume', e.target.value ? Number(e.target.value) : null)}
                placeholder="1600"
                min={0}
              />
            </div>

            <div className="form-field">
              <label>תיבת הילוכים</label>
              <select
                value={form.transmission}
                onChange={e => updateField('transmission', e.target.value as Transmission)}
              >
                <option value="">בחר...</option>
                {Object.entries(TRANSMISSION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>כוח סוס</label>
              <input
                type="number"
                value={form.horsepower ?? ''}
                onChange={e => updateField('horsepower', e.target.value ? Number(e.target.value) : null)}
                placeholder='כ"ס'
                min={0}
              />
            </div>
          </div>
        </section>

        {/* Ownership */}
        <section className="form-section">
          <h2 className="form-section-title">בעלות</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>יד</label>
              <input
                type="number"
                value={form.previousOwners ?? ''}
                onChange={e => updateField('previousOwners', e.target.value ? Number(e.target.value) : null)}
                placeholder="לדוגמה: 2"
                min={1}
                max={10}
              />
            </div>

            <div className="form-field">
              <label>בעלות נוכחית</label>
              <select
                value={form.currentOwnership}
                onChange={e => updateField('currentOwnership', e.target.value)}
              >
                <option value="">בחר...</option>
                <option value="פרטי">פרטי</option>
                <option value="ליסינג">ליסינג</option>
                <option value="השכרה">השכרה</option>
                <option value="חברה">חברה</option>
                <option value="מוניות">מוניות</option>
              </select>
            </div>

            <div className="form-field">
              <label>תוקף טסט</label>
              <input
                type="date"
                value={form.testDate}
                onChange={e => updateField('testDate', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Financial */}
        <section className="form-section">
          <h2 className="form-section-title">מחיר</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>מחיר מבוקש (₪)</label>
              <input
                type="number"
                value={form.price ?? ''}
                onChange={e => updateField('price', e.target.value ? Number(e.target.value) : null)}
                placeholder="85,000"
                min={0}
              />
            </div>

            <div className="form-field">
              <label>מחיר מקורי / מחירון (₪)</label>
              <input
                type="number"
                value={form.originalPrice ?? ''}
                onChange={e => updateField('originalPrice', e.target.value ? Number(e.target.value) : null)}
                placeholder="לפני הנחה"
                min={0}
              />
            </div>
          </div>
        </section>

        {/* Seller */}
        <section className="form-section">
          <h2 className="form-section-title">מוכר ומיקום</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>עיר</label>
              <input
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="תל אביב"
              />
            </div>

            <div className="form-field">
              <label>שם המוכר</label>
              <input
                value={form.sellerName}
                onChange={e => updateField('sellerName', e.target.value)}
                placeholder="שם"
              />
            </div>

            <div className="form-field">
              <label>טלפון</label>
              <input
                type="tel"
                value={form.sellerPhone}
                onChange={e => updateField('sellerPhone', e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>
          </div>
        </section>

        {/* Source */}
        <section className="form-section">
          <h2 className="form-section-title">מקור</h2>
          <div className="form-grid">
            <div className="form-field form-field-wide">
              <label>קישור למודעה</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={e => updateField('sourceUrl', e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>

            <div className="form-field">
              <label>אתר מקור</label>
              <select
                value={form.sourceSite}
                onChange={e => updateField('sourceSite', e.target.value)}
              >
                <option value="">בחר...</option>
                <option value="yad2">יד2</option>
                <option value="autotrade">אוטוטרייד</option>
                <option value="carsforsale">מכוניות למכירה</option>
                <option value="facebook">פייסבוק</option>
                <option value="other">אחר</option>
              </select>
            </div>
          </div>
        </section>

        {/* Status & Rating */}
        <section className="form-section">
          <h2 className="form-section-title">סטטוס ודירוג</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>סטטוס</label>
              <select
                value={form.status}
                onChange={e => updateField('status', e.target.value as CarStatus)}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>דירוג אישי</label>
              <RatingStars
                rating={form.rating}
                onChange={r => updateField('rating', r)}
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="form-section">
          <h2 className="form-section-title">תמונות</h2>
          <PhotoManager
            photos={form.photos}
            profilePhotoId={form.profilePhotoId}
            onChange={(photos, profilePhotoId) => {
              setForm(prev => ({ ...prev, photos, profilePhotoId }));
            }}
          />
        </section>

        {/* Notes */}
        <section className="form-section">
          <h2 className="form-section-title">הערות ועדכונים</h2>
          <NotesList
            notes={form.notes}
            onChange={notes => updateField('notes', notes)}
          />
        </section>

        {/* Submit */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף רכב'}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
