import * as cheerio from 'cheerio';

interface ScrapedPhoto {
  url: string;
  data?: string;
}

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
  photos?: ScrapedPhoto[];
}

export async function scrapeCarListing(url: string): Promise<ScrapedData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const hostname = new URL(url).hostname;

  let data: ScrapedData = { sourceUrl: url };

  // Detect source site
  if (hostname.includes('yad2')) {
    data.sourceSite = 'yad2';
    data = { ...data, ...scrapeYad2($, html) };
  } else if (hostname.includes('autotrade')) {
    data.sourceSite = 'autotrade';
    data = { ...data, ...scrapeAutoTrade($) };
  } else {
    data.sourceSite = 'other';
    data = { ...data, ...scrapeGeneric($, html) };
  }

  // Extract photos from the page
  const photoUrls = extractPhotoUrls($, url);
  if (photoUrls.length > 0) {
    data.photos = await downloadPhotos(photoUrls);
  }

  return data;
}

function scrapeYad2($: cheerio.CheerioAPI, html: string): Partial<ScrapedData> {
  const data: Partial<ScrapedData> = {};

  // Try JSON-LD first
  try {
    const jsonLd = $('script[type="application/ld+json"]').text();
    if (jsonLd) {
      const parsed = JSON.parse(jsonLd);
      if (parsed.name) {
        const parts = parsed.name.split(' ');
        if (parts.length >= 2) {
          data.make = parts[0];
          data.model = parts[1];
          if (parts.length > 2) data.subModel = parts.slice(2).join(' ');
        }
      }
      if (parsed.offers?.price) data.price = Number(parsed.offers.price);
    }
  } catch {}

  // Try extracting from page text with Next.js data
  try {
    const nextDataScript = $('script#__NEXT_DATA__').text();
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript);
      const pageProps = nextData?.props?.pageProps;
      if (pageProps) {
        const item = pageProps.item || pageProps.feedItem || pageProps.vehicleData;
        if (item) {
          data.make = data.make || item.manufacturer || item.make;
          data.model = data.model || item.model;
          data.subModel = data.subModel || item.subModel || item.trim;
          data.year = item.year || item.Year;
          data.mileage = item.kilometers || item.km || item.mileage;
          data.price = data.price || item.price || item.Price;
          data.city = item.city || item.City || item.area;
          data.color = item.color || item.Color;
          data.engineType = mapEngineType(item.engineType || item.fuel);
          data.transmission = mapTransmission(item.gearbox || item.transmission);
          data.previousOwners = item.hand || item.ownership;
        }
      }
    }
  } catch {}

  // Fallback: extract from OG tags
  if (!data.make) {
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const titleParts = ogTitle.split(/[\s,\-]+/).filter(Boolean);
    if (titleParts.length >= 2) {
      data.make = data.make || titleParts[0];
      data.model = data.model || titleParts[1];
    }
  }

  // Try to extract price from visible text
  if (!data.price) {
    const priceText = $('[class*="price"], [data-testid*="price"]').first().text();
    const priceMatch = priceText.replace(/[,₪\s]/g, '').match(/\d+/);
    if (priceMatch) data.price = Number(priceMatch[0]);
  }

  return data;
}

function scrapeAutoTrade($: cheerio.CheerioAPI): Partial<ScrapedData> {
  const data: Partial<ScrapedData> = {};

  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
  if (ogTitle) {
    const parts = ogTitle.split(/[\s,\-]+/).filter(Boolean);
    if (parts.length >= 2) {
      data.make = parts[0];
      data.model = parts[1];
    }
  }

  // Look for structured data in the page
  $('table tr, .details-row, [class*="detail"], [class*="spec"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('שנה') || text.includes('שנת')) {
      const match = text.match(/\d{4}/);
      if (match) data.year = Number(match[0]);
    }
    if (text.includes('קילומטר') || text.includes('ק"מ')) {
      const match = text.replace(/,/g, '').match(/\d+/);
      if (match) data.mileage = Number(match[0]);
    }
    if (text.includes('מחיר') || text.includes('₪')) {
      const match = text.replace(/[,₪\s]/g, '').match(/\d+/);
      if (match && Number(match[0]) > 1000) data.price = Number(match[0]);
    }
  });

  return data;
}

function scrapeGeneric($: cheerio.CheerioAPI, html: string): Partial<ScrapedData> {
  const data: Partial<ScrapedData> = {};

  // OG meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const fullText = ogTitle + ' ' + ogDesc;

  // Try to extract make and model from title
  const titleParts = ogTitle.split(/[\s,\-|]+/).filter(Boolean);
  if (titleParts.length >= 2) {
    data.make = titleParts[0];
    data.model = titleParts[1];
    if (titleParts.length > 2) {
      const yearCandidate = titleParts.find(p => /^\d{4}$/.test(p) && Number(p) >= 1990 && Number(p) <= 2030);
      if (yearCandidate) data.year = Number(yearCandidate);
    }
  }

  // Extract year from text
  if (!data.year) {
    const yearMatch = fullText.match(/\b(20[0-2]\d|19[9]\d)\b/);
    if (yearMatch) data.year = Number(yearMatch[1]);
  }

  // Extract price
  const pricePatterns = [
    /₪\s*([\d,]+)/,
    /([\d,]+)\s*₪/,
    /מחיר[:\s]*([\d,]+)/,
    /price[:\s]*([\d,]+)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = fullText.match(pattern) || html.match(pattern);
    if (match) {
      const price = Number(match[1].replace(/,/g, ''));
      if (price > 1000) { data.price = price; break; }
    }
  }

  // Extract mileage
  const kmPatterns = [
    /([\d,]+)\s*ק"מ/,
    /([\d,]+)\s*קילומטר/,
    /([\d,]+)\s*km/i,
  ];
  for (const pattern of kmPatterns) {
    const match = fullText.match(pattern) || html.match(pattern);
    if (match) {
      data.mileage = Number(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Try JSON-LD
  try {
    $('script[type="application/ld+json"]').each((_, el) => {
      const text = $(el).text();
      const parsed = JSON.parse(text);
      if (parsed['@type'] === 'Car' || parsed['@type'] === 'Vehicle' || parsed['@type'] === 'Product') {
        data.make = data.make || parsed.brand?.name || parsed.manufacturer;
        data.model = data.model || parsed.model;
        data.year = data.year || parsed.vehicleModelDate || parsed.productionDate;
        if (parsed.offers?.price) data.price = data.price || Number(parsed.offers.price);
        if (parsed.mileageFromOdometer?.value) data.mileage = Number(parsed.mileageFromOdometer.value);
        if (parsed.color) data.color = parsed.color;
      }
    });
  } catch {}

  return data;
}

function extractPhotoUrls($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const urls = new Set<string>();
  const baseOrigin = new URL(baseUrl).origin;

  // Common image selectors for car listing sites
  const selectors = [
    '[class*="gallery"] img',
    '[class*="slider"] img',
    '[class*="carousel"] img',
    '[class*="photo"] img',
    '[class*="image"] img',
    '[data-testid*="image"] img',
    '[data-testid*="gallery"] img',
    'picture source',
    'meta[property="og:image"]',
  ];

  // OG image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) urls.add(resolveUrl(ogImage, baseOrigin));

  // Gallery images
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset')?.split(',')[0]?.trim()?.split(' ')[0];
      if (src && isValidImageUrl(src)) {
        urls.add(resolveUrl(src, baseOrigin));
      }
    });
  }

  // Also look for high-res images in data attributes
  $('[data-large-src], [data-full-src], [data-zoom-src]').each((_, el) => {
    const src = $(el).attr('data-large-src') || $(el).attr('data-full-src') || $(el).attr('data-zoom-src');
    if (src && isValidImageUrl(src)) {
      urls.add(resolveUrl(src, baseOrigin));
    }
  });

  // Try to find image URLs in Next.js data
  try {
    const nextDataScript = $('script#__NEXT_DATA__').text();
    if (nextDataScript) {
      const imgMatches = nextDataScript.match(/https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*/gi);
      if (imgMatches) {
        for (const img of imgMatches) {
          if (isValidImageUrl(img)) urls.add(img);
        }
      }
    }
  } catch {}

  // Filter out tiny images (icons, logos), limit to reasonable number
  return Array.from(urls).slice(0, 20);
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.startsWith('data:')) return false;
  const lower = url.toLowerCase();
  // Filter out common non-car images
  if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') ||
      lower.includes('favicon') || lower.includes('placeholder') ||
      lower.includes('1x1') || lower.includes('pixel')) return false;
  // Must look like an image URL or have no extension (CDN images)
  return /\.(jpg|jpeg|png|webp|gif)/i.test(lower) || lower.includes('/image') || lower.includes('cloudinary') || lower.includes('imgix');
}

function resolveUrl(url: string, baseOrigin: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseOrigin + url;
  return baseOrigin + '/' + url;
}

async function downloadPhotos(urls: string[]): Promise<ScrapedPhoto[]> {
  const photos: ScrapedPhoto[] = [];
  // Download photos in parallel, max 10
  const toDownload = urls.slice(0, 10);
  const results = await Promise.allSettled(
    toDownload.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*',
          },
        });
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) return null;
        const buffer = await res.arrayBuffer();
        // Skip very small images (likely icons)
        if (buffer.byteLength < 5000) return null;
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        return { url, data: dataUrl };
      } catch {
        return null;
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      photos.push(result.value);
    }
  }

  return photos;
}

function mapEngineType(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('בנזין') || lower.includes('petrol') || lower.includes('gasoline')) return 'petrol';
  if (lower.includes('דיזל') || lower.includes('diesel')) return 'diesel';
  if (lower.includes('חשמלי') || lower.includes('electric')) return 'electric';
  if (lower.includes('היברידי נטען') || lower.includes('plug')) return 'plugin_hybrid';
  if (lower.includes('היברידי') || lower.includes('hybrid')) return 'hybrid';
  return undefined;
}

function mapTransmission(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('אוטומט') || lower.includes('automatic')) return 'automatic';
  if (lower.includes('ידנ') || lower.includes('manual')) return 'manual';
  if (lower.includes('רובוט') || lower.includes('robotic')) return 'robotic';
  return undefined;
}
