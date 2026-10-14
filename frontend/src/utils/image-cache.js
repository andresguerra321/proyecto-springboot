/**
 * ToolRent Image Cache & Offline Armor Shield
 * 
 * Provides:
 * 1. Persistent offline caching using the Web Cache Storage API ('toolrent-media-cache-v1').
 * 2. Background preloading of catalog tool images on app initialization.
 * 3. Graceful fallback resolution: Cache Storage -> Memory Blob -> Branded Technical Blueprint SVG.
 * 4. Zero broken-image icons even when offline or on unstable networks.
 */

const CACHE_NAME = 'toolrent-media-cache-v1';

// In-memory cache of Blob object URLs to avoid redundant allocations
const objectUrlMap = new Map();

/**
 * Generates an ultra-crisp, branded SVG technical blueprint for a tool
 * Used when an image cannot be reached from network or cache storage.
 */
export function getBlueprintFallbackSvg(toolName = 'Equipo Industrial', category = 'Construcción') {
  const safeName = (toolName || 'Herramienta').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCat = (category || 'Construcción').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1"/>
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      </pattern>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#f1f5f9" />
      </linearGradient>
    </defs>
    
    <!-- Background & Engineering Grid -->
    <rect width="100%" height="100%" fill="url(#bgGrad)" />
    <rect width="100%" height="100%" fill="url(#grid)" />

    <!-- Corner Framing Accents -->
    <path d="M 30 50 L 30 30 L 50 30" fill="none" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>
    <path d="M 770 50 L 770 30 L 750 30" fill="none" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>
    <path d="M 30 550 L 30 570 L 50 570" fill="none" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>
    <path d="M 770 550 L 770 570 L 750 570" fill="none" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>

    <!-- Central Tech Target Circle -->
    <circle cx="400" cy="270" r="140" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6,6" />
    <circle cx="400" cy="270" r="110" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <circle cx="400" cy="270" r="90" fill="#fff7ed" stroke="#FF5A1F" stroke-width="2" />

    <!-- ToolRent Orange Monogram Mark -->
    <g transform="translate(365, 235) scale(2.8)">
      <path d="M4 4h7v4H4z" fill="#FF5A1F"/>
      <path d="M7 8v12h4V8z" fill="#FF5A1F"/>
      <path d="M15 4h5v4h-5z" fill="#0f172a"/>
      <path d="M15 10h4v10h-4z" fill="#0f172a"/>
    </g>

    <!-- Calibration / Precision Crosshairs -->
    <line x1="230" y1="270" x2="270" y2="270" stroke="#FF5A1F" stroke-width="2" stroke-linecap="round"/>
    <line x1="530" y1="270" x2="570" y2="270" stroke="#FF5A1F" stroke-width="2" stroke-linecap="round"/>
    <line x1="400" y1="100" x2="400" y2="140" stroke="#FF5A1F" stroke-width="2" stroke-linecap="round"/>
    <line x1="400" y1="400" x2="400" y2="440" stroke="#FF5A1F" stroke-width="2" stroke-linecap="round"/>

    <!-- Status Badge -->
    <rect x="300" y="405" width="200" height="28" rx="14" fill="#0f172a" />
    <text x="400" y="423" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5">MODO OFFLINE BLINDADO</text>

    <!-- Tool Specs Typography -->
    <text x="400" y="475" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">${safeName}</text>
    <text x="400" y="505" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle">${safeCat} • ToolRent Certified</text>

    <!-- Watermark / Footer -->
    <text x="400" y="560" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">TOOLRENT MEDIA SHIELD // OFFLINE CACHE STORAGE V1</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Checks if Cache Storage API is supported in current environment
 */
export function isCacheStorageSupported() {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Retrieves a cached image as a local Object URL (Blob)
 * If found, returns the blob URL; otherwise returns null.
 */
export async function getCachedImageObjectUrl(url) {
  if (!url || !isCacheStorageSupported()) return null;

  if (objectUrlMap.has(url)) {
    return objectUrlMap.get(url);
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    if (response) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      objectUrlMap.set(url, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.warn('[ToolRent Cache Shield] Error leyendo de Cache Storage:', err);
  }

  return null;
}

/**
 * Preloads and caches a single image URL into Cache Storage
 */
export async function cacheImage(url) {
  if (!url || !isCacheStorageSupported()) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return true;

    const response = await fetch(url, {
      mode: 'cors',
      cache: 'default',
    });

    if (response && response.status === 200) {
      await cache.put(url, response.clone());
      return true;
    }
  } catch (err) {
    // Offline or network error during background prefetch is silently captured
  }
  return false;
}

/**
 * Preloads a batch of URLs sequentially or in micro-batches
 * Designed not to freeze the main thread or flood bandwidth on load.
 */
export async function preloadCatalogImages(urls = []) {
  if (!urls || urls.length === 0 || !isCacheStorageSupported()) return;

  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  let cachedCount = 0;

  // Process in chunks of 3 for smooth network pipelining
  const chunkSize = 3;
  for (let i = 0; i < uniqueUrls.length; i += chunkSize) {
    const chunk = uniqueUrls.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (u) => {
        const success = await cacheImage(u);
        if (success) cachedCount++;
      })
    );
  }

  console.info(`%c[ToolRent Cache Shield]%c Blindaje activo: ${cachedCount}/${uniqueUrls.length} imágenes cacheadas para modo offline.`, 
    'background: #FF5A1F; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: #0f172a; font-weight: 500;'
  );
}

/**
 * Global Image Error Handler (handles fallback resolution)
 * Attached automatically to <img> elements or invoked by onerror.
 */
export async function handleImageError(imgEl, originalUrl, category = '', toolName = '') {
  if (!imgEl) return;

  // Prevent infinite retry loops
  const retries = parseInt(imgEl.dataset.shieldRetries || '0', 10);
  if (retries >= 2) {
    imgEl.src = getBlueprintFallbackSvg(toolName || imgEl.alt, category);
    imgEl.classList.add('opacity-90');
    return;
  }

  imgEl.dataset.shieldRetries = (retries + 1).toString();

  // Step 1: Attempt to recover from Cache Storage
  const cachedBlobUrl = await getCachedImageObjectUrl(originalUrl);
  if (cachedBlobUrl && cachedBlobUrl !== imgEl.src) {
    imgEl.src = cachedBlobUrl;
    return;
  }

  // Step 2: Fallback to high-res engineering SVG blueprint
  imgEl.src = getBlueprintFallbackSvg(toolName || imgEl.alt, category);
  imgEl.classList.add('opacity-95');
}

// Curated bank of real database tool image URLs (matching V2__seed_data.sql) for offline preloading
export const catalogImageUrls = [
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&auto=format&fit=crop&q=80',
];

/**
 * Initializes the ToolRent Image Cache Shield
 * Registers global window helpers and sets up network status listeners.
 */
export function initImageCacheShield(initialUrls = catalogImageUrls) {
  if (typeof window === 'undefined') return;

  // Register on window for direct onerror attribute access in dynamic HTML strings
  window.ToolRentCacheShield = {
    handleImageError,
    getBlueprintFallbackSvg,
    getCachedImageObjectUrl,
    preloadCatalogImages,
    CACHE_NAME
  };

  // Monitor network connectivity changes
  window.addEventListener('online', () => {
    console.info('[ToolRent Cache Shield] Conexión restaurada: sincronizando catálogo en tiempo real.');
  });

  window.addEventListener('offline', () => {
    console.warn('[ToolRent Cache Shield] Conexión perdida: operando en modo protegido 100% offline.');
  });

  // Launch background preloader if URLs provided
  const urlsToPreload = initialUrls.length > 0 ? initialUrls : catalogImageUrls;
  if (urlsToPreload.length > 0) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => preloadCatalogImages(urlsToPreload));
    } else {
      setTimeout(() => preloadCatalogImages(urlsToPreload), 300);
    }
  }
}
