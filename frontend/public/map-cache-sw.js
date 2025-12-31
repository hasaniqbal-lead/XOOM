const CACHE_NAME = 'xoom-map-tiles-v1';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const TILE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// OpenStreetMap tile pattern
const MAP_TILE_PATTERN = /^https:\/\/[abc]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/;

self.addEventListener('install', (event) => {
  console.log('🗺️  Map cache service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🗺️  Map cache service worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only cache map tiles
  if (!MAP_TILE_PATTERN.test(url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get from cache first
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
        const now = new Date();
        
        // Return cached if still fresh
        if (now - cachedDate < TILE_CACHE_DURATION) {
          return cachedResponse;
        }
      }

      // Fetch from network
      try {
        const networkResponse = await fetch(event.request);
        
        if (networkResponse.ok) {
          // Clone the response
          const responseToCache = networkResponse.clone();
          
          // Add custom header for cache date
          const headers = new Headers(responseToCache.headers);
          headers.append('sw-cached-date', new Date().toISOString());
          
          const cachedResponse = new Response(await responseToCache.blob(), {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
          });

          // Store in cache
          cache.put(event.request, cachedResponse);
          
          // Check and manage cache size
          manageCacheSize(cache);
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed, return cached version even if expired
        if (cachedResponse) {
          console.log('📍 Serving map tiles from cache (offline mode)');
          return cachedResponse;
        }
        throw error;
      }
    })
  );
});

// Manage cache size
async function manageCacheSize(cache) {
  const keys = await cache.keys();
  let totalSize = 0;
  const sizeMap = new Map();

  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      const size = blob.size;
      totalSize += size;
      sizeMap.set(key.url, {
        size,
        date: new Date(response.headers.get('sw-cached-date') || 0),
      });
    }
  }

  // If over limit, remove oldest tiles
  if (totalSize > MAX_CACHE_SIZE) {
    const sorted = Array.from(sizeMap.entries()).sort(
      (a, b) => a[1].date - b[1].date
    );

    let removed = 0;
    for (const [url, data] of sorted) {
      if (totalSize - removed < MAX_CACHE_SIZE * 0.8) break;
      
      await cache.delete(url);
      removed += data.size;
    }
    
    console.log(`🗺️  Removed ${(removed / 1024 / 1024).toFixed(2)} MB from map cache`);
  }
}

// Message handler for manual cache management
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_MAP_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys();
        let totalSize = 0;
        
        for (const key of keys) {
          const response = await cache.match(key);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
        
        event.ports[0].postMessage({ 
          size: totalSize,
          count: keys.length,
        });
      })
    );
  }
});
