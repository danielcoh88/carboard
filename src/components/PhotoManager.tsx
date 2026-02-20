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
