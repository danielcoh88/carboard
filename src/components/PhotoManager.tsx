import { useRef, useState } from 'react';
import { Photo, generateId } from '../types/car';

interface Props {
  photos: Photo[];
  profilePhotoId: string;
  onChange: (photos: Photo[], profilePhotoId: string) => void;
  readOnly?: boolean;
}

export default function PhotoManager({ photos, profilePhotoId, onChange, readOnly = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  const effectiveProfileId = profilePhotoId || (photos.length > 0 ? photos[0].id : '');

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newPhotos: Photo[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const data = await readFileAsDataUrl(file);
      newPhotos.push({
        id: generateId(),
        data,
        name: file.name,
        addedAt: new Date().toISOString(),
      });
    }
    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos];
      const newProfileId = effectiveProfileId || newPhotos[0].id;
      onChange(updated, newProfileId);
    }
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleDelete(photoId: string) {
    const updated = photos.filter(p => p.id !== photoId);
    let newProfileId = effectiveProfileId;
    if (photoId === effectiveProfileId) {
      newProfileId = updated.length > 0 ? updated[0].id : '';
    }
    onChange(updated, newProfileId);
    if (selectedPhoto === photoId) setSelectedPhoto(null);
  }

  function handleSetProfile(photoId: string) {
    onChange(photos, photoId);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleAddFromUrl() {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    setUrlLoading(true);
    setUrlError('');
    try {
      const res = await fetch('/api/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'שגיאה בהורדת התמונה');
      }
      const { data, contentType } = await res.json();
      const photo: Photo = {
        id: generateId(),
        data: `data:${contentType};base64,${data}`,
        name: trimmed.split('/').pop()?.split('?')[0] || 'image',
        addedAt: new Date().toISOString(),
      };
      const updated = [...photos, photo];
      const newProfileId = effectiveProfileId || photo.id;
      onChange(updated, newProfileId);
      setImageUrl('');
      setShowUrlInput(false);
    } catch (err: any) {
      setUrlError(err.message || 'לא ניתן להוריד את התמונה');
    } finally {
      setUrlLoading(false);
    }
  }

  const viewingPhoto = selectedPhoto ? photos.find(p => p.id === selectedPhoto) : null;

  return (
    <div className="photo-manager">
      {!readOnly && (
        <div
          className={`photo-upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📷</div>
          <div className="upload-text">גרור תמונות לכאן או לחץ להעלאה</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {!readOnly && (
        <div className="photo-url-section">
          {!showUrlInput ? (
            <button
              className="btn btn-text btn-sm"
              onClick={() => setShowUrlInput(true)}
            >
              🔗 הוסף תמונה מלינק
            </button>
          ) : (
            <div className="photo-url-input-row">
              <input
                type="url"
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setUrlError(''); }}
                placeholder="הדבק לינק לתמונה..."
                dir="ltr"
                className="photo-url-input"
                onKeyDown={e => { if (e.key === 'Enter') handleAddFromUrl(); }}
                autoFocus
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddFromUrl}
                disabled={urlLoading || !imageUrl.trim()}
              >
                {urlLoading ? '⏳' : 'הוסף'}
              </button>
              <button
                className="btn btn-text btn-sm"
                onClick={() => { setShowUrlInput(false); setImageUrl(''); setUrlError(''); }}
              >
                ✕
              </button>
            </div>
          )}
          {urlError && <div className="photo-url-error">{urlError}</div>}
        </div>
      )}

      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map(photo => (
            <div
              key={photo.id}
              className={`photo-item ${photo.id === effectiveProfileId ? 'is-profile' : ''}`}
            >
              <img
                src={photo.data}
                alt={photo.name}
                onClick={() => setSelectedPhoto(photo.id)}
              />
              {photo.id === effectiveProfileId && (
                <div className="profile-badge">תמונת פרופיל</div>
              )}
              {!readOnly && (
                <div className="photo-actions">
                  {photo.id !== effectiveProfileId && (
                    <button
                      className="photo-action-btn"
                      onClick={e => { e.stopPropagation(); handleSetProfile(photo.id); }}
                      title="הגדר כתמונת פרופיל"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    className="photo-action-btn photo-action-delete"
                    onClick={e => { e.stopPropagation(); handleDelete(photo.id); }}
                    title="מחק תמונה"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingPhoto && (
        <div className="photo-lightbox" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>✕</button>
            <img src={viewingPhoto.data} alt={viewingPhoto.name} />
            <div className="lightbox-nav">
              <button
                onClick={() => {
                  const idx = photos.findIndex(p => p.id === selectedPhoto);
                  const prev = photos[(idx - 1 + photos.length) % photos.length];
                  setSelectedPhoto(prev.id);
                }}
                disabled={photos.length <= 1}
              >
                →
              </button>
              <span>{photos.findIndex(p => p.id === selectedPhoto) + 1} / {photos.length}</span>
              <button
                onClick={() => {
                  const idx = photos.findIndex(p => p.id === selectedPhoto);
                  const next = photos[(idx + 1) % photos.length];
                  setSelectedPhoto(next.id);
                }}
                disabled={photos.length <= 1}
              >
                ←
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
