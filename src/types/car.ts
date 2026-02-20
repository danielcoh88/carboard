export interface Photo {
  id: string;
  data: string; // base64 data URL
  name: string;
  addedAt: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export type EngineType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | '';
export type Transmission = 'automatic' | 'manual' | 'robotic' | '';
export type CarStatus = 'new' | 'interested' | 'contacted' | 'inspected' | 'negotiating' | 'rejected' | 'purchased';

export interface Car {
  id: string;
  // Basic info
  make: string;
  model: string;
  subModel: string;
  year: number | null;
  // Technical
  mileage: number | null;
  engineType: EngineType;
  engineVolume: number | null;
  transmission: Transmission;
  horsepower: number | null;
  // Details
  color: string;
  previousOwners: number | null;
  currentOwnership: string;
  testDate: string;
  // Financial
  price: number | null;
  originalPrice: number | null;
  // Location & Seller
  city: string;
  sellerName: string;
  sellerPhone: string;
  // Source
  sourceUrl: string;
  sourceSite: string;
  // Management
  status: CarStatus;
  rating: number;
  // Media
  photos: Photo[];
  profilePhotoId: string;
  // Notes
  notes: Note[];
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export const ENGINE_TYPE_LABELS: Record<string, string> = {
  petrol: 'בנזין',
  diesel: 'דיזל',
  electric: 'חשמלי',
  hybrid: 'היברידי',
  plugin_hybrid: 'היברידי נטען',
};

export const TRANSMISSION_LABELS: Record<string, string> = {
  automatic: 'אוטומטית',
  manual: 'ידנית',
  robotic: 'רובוטית',
};

export const STATUS_LABELS: Record<CarStatus, string> = {
  new: 'חדש',
  interested: 'מעוניין',
  contacted: 'יצרתי קשר',
  inspected: 'נבדק',
  negotiating: 'במו"מ',
  rejected: 'נפסל',
  purchased: 'נרכש',
};

export const STATUS_COLORS: Record<CarStatus, string> = {
  new: '#6366f1',
  interested: '#2563eb',
  contacted: '#0891b2',
  inspected: '#059669',
  negotiating: '#d97706',
  rejected: '#dc2626',
  purchased: '#16a34a',
};

export const COMMON_MAKES = [
  'טויוטה', 'יונדאי', 'קיה', 'מאזדה', 'הונדה', 'ניסאן', 'מיצובישי',
  'סוזוקי', 'שברולט', 'פולקסווגן', 'סקודה', 'סיאט', 'אופל', 'פורד',
  'פיג\'ו', 'סיטרואן', 'רנו', 'BMW', 'מרצדס', 'אאודי', 'וולוו',
  'סובארו', 'לקסוס', 'אינפיניטי', 'טסלה', 'MG', 'BYD', 'צ\'רי',
  'ג\'ילי', 'אחר',
];

export const COMMON_COLORS = [
  'לבן', 'שחור', 'כסוף', 'אפור', 'אדום', 'כחול', 'ירוק', 'חום',
  'בז\'', 'זהב', 'כתום', 'צהוב', 'סגול', 'בורדו', 'טורקיז', 'אחר',
];

export function createEmptyCar(): Omit<Car, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    make: '',
    model: '',
    subModel: '',
    year: null,
    mileage: null,
    engineType: '',
    engineVolume: null,
    transmission: '',
    horsepower: null,
    color: '',
    previousOwners: null,
    currentOwnership: '',
    testDate: '',
    price: null,
    originalPrice: null,
    city: '',
    sellerName: '',
    sellerPhone: '',
    sourceUrl: '',
    sourceSite: '',
    status: 'new',
    rating: 0,
    photos: [],
    profilePhotoId: '',
    notes: [],
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatPrice(price: number | null): string {
  if (price === null || price === 0) return '';
  return '₪' + price.toLocaleString('he-IL');
}

export function formatMileage(km: number | null): string {
  if (km === null) return '';
  return km.toLocaleString('he-IL') + ' ק"מ';
}

export function getProfilePhoto(car: Car): string | null {
  if (car.profilePhotoId) {
    const photo = car.photos.find(p => p.id === car.profilePhotoId);
    if (photo) return photo.data;
  }
  if (car.photos.length > 0) return car.photos[0].data;
  return null;
}

export function getCarTitle(car: Car): string {
  const parts = [car.make, car.model, car.subModel].filter(Boolean);
  if (car.year) parts.push(car.year.toString());
  return parts.join(' ') || 'רכב ללא שם';
}
