import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCars } from '../store/CarContext';
import { Car, Photo, generateId } from '../types/car';
import PhotoManager from './PhotoManager';

interface ScrapedData {
  make?: string;
  model?: string;
  subModel?: string;
  year?: number;
  mileage?: number;
  engineType?: string;
  engineVolume?: number;
  transmission?: string;
  horsepower?: number;
  color?: string;
  previousOwners?: number;
  currentOwnership?: string;
  price?: number;
  city?: string;
  sellerName?: string;
  sellerPhone?: string;
  sourceUrl?: string;
  sourceSite?: string;
  photos?: { url: string; data?: string }[];
}

export default function ImportModal() {
  const navigate = useNavigate();
  const { addCar } = useCars();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scraped, setScraped] = useState<ScrapedData | null>(null);
  const [importedPhotos, setImportedPhotos] = useState<Photo[]>([]);
  const [profilePhotoId, setProfilePhotoId] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'שגיאה בשליפת הנתונים');
      }
      const data: ScrapedData = await res.json();
      setScraped(data);

      // Convert photo URLs to Photo objects
      if (data.photos && data.photos.length > 0) {
        const photos: Photo[] = [];
        for (const p of data.photos) {
          if (p.data) {
            const photo: Photo = {
              id: generateId(),
              data: p.data,
              name: `imported-${photos.length + 1}`,
              addedAt: new Date().toISOString(),
            };
            photos.push(photo);
          }
        }
        setImportedPhotos(photos);
        if (photos.length > 0) setProfilePhotoId(photos[0].id);
      }

      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'שגיאה בחיבור לשרת. ודא שהשרת רץ (npm run dev:server)');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!scraped) return;
    const now = new Date().toISOString();
    const car: Car = {
      id: generateId(),
      make: scraped.make || '',
      model: scraped.model || '',
      subModel: scraped.subModel || '',
      year: scraped.year || null,
      mileage: scraped.mileage || null,
      engineType: (scraped.engineType as Car['engineType']) || '',
      engineVolume: scraped.engineVolume || null,
      transmission: (scraped.transmission as Car['transmission']) || '',
      horsepower: scraped.horsepower || null,
      color: scraped.color || '',
      previousOwners: scraped.previousOwners || null,
      currentOwnership: scraped.currentOwnership || '',
      testDate: '',
      price: scraped.price || null,
      originalPrice: null,
      city: scraped.city || '',
      sellerName: scraped.sellerName || '',
      sellerPhone: scraped.sellerPhone || '',
      sourceUrl: url.trim(),
      sourceSite: scraped.sourceSite || '',
      status: 'new',
      rating: 0,
      photos: importedPhotos,
      profilePhotoId,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    await addCar(car);
    navigate(`/car/${car.id}`);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn btn-text" onClick={() => navigate('/')}>→ חזרה</button>
        <h1>ייבוא רכב מלינק</h1>
      </div>

      {step === 'input' && (
        <div className="import-form">
          <p className="import-desc">
            הדבק קישור למודעת רכב ונשלוף עבורך את הפרטים והתמונות
          </p>
          <div className="import-url-row">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.yad2.co.il/vehicles/..."
              dir="ltr"
              className="import-url-input"
              onKeyDown={e => {
                if (e.key === 'Enter') handleFetch();
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleFetch}
              disabled={loading || !url.trim()}
            >
              {loading ? 'שולף...' : 'שלוף פרטים'}
            </button>
          </div>
          {error && <div className="import-error">{error}</div>}
          <div className="import-info">
            <p>💡 נתמכים: אתרי מכירת רכבים עם מידע גלוי בדף</p>
            <p>🔧 השרת צריך לרוץ: <code dir="ltr">npm run dev:server</code></p>
          </div>
        </div>
      )}

      {step === 'preview' && scraped && (
        <div className="import-preview">
          <h2>תצוגה מקדימה</h2>
          <p className="import-desc">בדוק את הפרטים שנשלפו ולחץ "ייבא" להוספה</p>

          <div className="import-data">
            {scraped.make && <div className="import-field"><span>יצרן:</span> <strong>{scraped.make}</strong></div>}
            {scraped.model && <div className="import-field"><span>דגם:</span> <strong>{scraped.model}</strong></div>}
            {scraped.subModel && <div className="import-field"><span>תת דגם:</span> <strong>{scraped.subModel}</strong></div>}
            {scraped.year && <div className="import-field"><span>שנה:</span> <strong>{scraped.year}</strong></div>}
            {scraped.mileage && <div className="import-field"><span>ק"מ:</span> <strong>{scraped.mileage.toLocaleString()}</strong></div>}
            {scraped.price && <div className="import-field"><span>מחיר:</span> <strong>₪{scraped.price.toLocaleString()}</strong></div>}
            {scraped.city && <div className="import-field"><span>עיר:</span> <strong>{scraped.city}</strong></div>}
            {scraped.engineType && <div className="import-field"><span>מנוע:</span> <strong>{scraped.engineType}</strong></div>}
            {scraped.transmission && <div className="import-field"><span>תיבת הילוכים:</span> <strong>{scraped.transmission}</strong></div>}
            {scraped.color && <div className="import-field"><span>צבע:</span> <strong>{scraped.color}</strong></div>}
            {scraped.previousOwners && <div className="import-field"><span>יד:</span> <strong>{scraped.previousOwners}</strong></div>}
          </div>

          {importedPhotos.length > 0 && (
            <div className="import-photos-section">
              <h3>תמונות ({importedPhotos.length})</h3>
              <PhotoManager
                photos={importedPhotos}
                profilePhotoId={profilePhotoId}
                onChange={(photos, pid) => { setImportedPhotos(photos); setProfilePhotoId(pid); }}
              />
            </div>
          )}

          <div className="import-actions">
            <button className="btn btn-primary btn-lg" onClick={handleImport}>
              ייבא רכב
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => { setStep('input'); setScraped(null); }}>
              חזרה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
