importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const CACHE_NAME = 'epe-league-shell-v3';
const MASTER_LOGO_URL = 'https://i.postimg.cc/hjmBHkfN/08469fba-3b41-4117-964b-745b2eca53f4-20260726-052311-0000.png';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo.jpg',
  MASTER_LOGO_URL
];

// PWA Service Worker Lifecycle Event Listeners
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] SW Installed & Caching App Shell');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] SW Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

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
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

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
          if (request.destination === 'image' || request.url.includes('.png') || request.url.includes('.jpg')) {
            return caches.match(MASTER_LOGO_URL) || caches.match('/logo.png');
          }
          console.warn('[SW] Offline fetch fallback unavailable:', request.url, err);
        });
    })
  );
});

fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'League Notification';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || '',
        icon: '/logo.png',
        data: payload.data,
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(err => {
    console.error('Failed to load firebase config for service worker', err);
  });

