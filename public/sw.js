const CACHE_NAME = 'epe-league-shell-v4';
const MASTER_LOGO_URL = 'https://i.postimg.cc/hjmBHkfN/08469fba-3b41-4117-964b-745b2eca53f4-20260726-052311-0000.png';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  MASTER_LOGO_URL
];

// Service Worker Install: Cache critical app shell assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker & Caching App Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate: Clean up stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker & Claiming Clients');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Service Worker Fetch: Cache-first for assets, Network-first with fallback for navigation
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests or browser internal requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // Handle navigation requests (HTML page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Serve cached index.html or root when offline
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        })
    );
    return;
  }

  // Handle JS, CSS, Images, Fonts, and Master Logo
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronous background revalidation
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {/* Silent catch for offline */});
        return cachedResponse;
      }

      // Not in cache: fetch from network and cache
      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (request.url.startsWith(self.location.origin) || request.url === MASTER_LOGO_URL)
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch((err) => {
          // Fallback for missing images offline
          if (request.destination === 'image' || request.url.includes('.png') || request.url.includes('.jpg')) {
            return caches.match(MASTER_LOGO_URL) || caches.match('/logo.png');
          }
          console.warn('[SW] Offline fetch fallback unavailable:', request.url, err);
        });
    })
  );
});
