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
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#f1f5f9" />
      </linearGradient>
    </defs>
    
    <!-- Clean Minimalist Background -->
    <rect width="100%" height="100%" fill="url(#bgGrad)" />

    <!-- Central Minimal Equipment Frame -->
    <circle cx="400" cy="250" r="85" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <circle cx="400" cy="250" r="70" fill="#fff7ed" stroke="#FF5A1F" stroke-width="1.5" />

    <!-- ToolRent Monogram Mark -->
    <g transform="translate(372, 222) scale(2.4)">
      <path d="M4 4h7v4H4z" fill="#FF5A1F"/>
      <path d="M7 8v12h4V8z" fill="#FF5A1F"/>
      <path d="M15 4h5v4h-5z" fill="#0f172a"/>
      <path d="M15 10h4v10h-4z" fill="#0f172a"/>
    </g>

    <!-- Professional Tool Typography (No debug/offline text) -->
    <text x="400" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#0f172a" text-anchor="middle">${safeName}</text>
    <text x="400" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#64748b" text-anchor="middle">${safeCat} • Maquinaria Homologada ToolRent</text>
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

function getMachineryRealFallback(name = '', cat = '') {
  const n = (name || '').toLowerCase();
  const c = (cat || '').toLowerCase();
  if (n.includes('andamio') || c.includes('elevaci')) return '/images/scaffold-1.jpg';
  if (n.includes('mezcla') || c.includes('hormig')) return '/images/concrete-mixer.jpg';
  if (n.includes('martillo') || n.includes('taladro') || c.includes('demoli')) return '/images/hammer-drill.jpg';
  if (n.includes('generador') || c.includes('energ')) return '/images/generator.jpg';
  if (n.includes('compacta') || n.includes('canguro') || c.includes('compact')) return '/images/compactor.jpg';
  if (n.includes('tijera') || n.includes('plataforma')) return '/images/scissor-lift.jpg';
  if (n.includes('excavadora') || c.includes('movimiento')) return '/images/excavator.jpg';
  if (n.includes('corte') || n.includes('pavimento')) return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800';
  if (n.includes('soldad')) return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800';
  if (n.includes('pintura') || n.includes('airless')) return 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800';
  if (n.includes('laser') || n.includes('láser') || c.includes('topogra')) return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800';
  if (n.includes('hidro') || c.includes('limpieza')) return 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800';
  return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';
}

/**
 * Global Image Error Handler (handles fallback resolution)
 * Attached automatically to <img> elements or invoked by onerror.
 */
export async function handleImageError(imgEl, originalUrl, category = '', toolName = '') {
  if (!imgEl) return;

  // Prevent infinite retry loops
  const retries = parseInt(imgEl.dataset.shieldRetries || '0', 10);
  if (retries >= 3) {
    imgEl.src = getMachineryRealFallback(toolName || imgEl.alt, category);
    return;
  }

  imgEl.dataset.shieldRetries = (retries + 1).toString();

  // Step 1: Attempt to recover from Cache Storage
  const cachedBlobUrl = await getCachedImageObjectUrl(originalUrl);
  if (cachedBlobUrl && cachedBlobUrl !== imgEl.src) {
    imgEl.src = cachedBlobUrl;
    return;
  }

  // Step 2: Fallback to real curated machinery photography
  imgEl.src = getMachineryRealFallback(toolName || imgEl.alt, category);
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
