const CACHE_VERSION = 'fitai-shell-v17';
const APP_SHELL = [
  '/',
  '/roadmap',
  '/camera',
  '/diary',
  '/profile',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/css/main.css',
  '/assets/icons/fitai-icon.svg',
  '/assets/js/i18n.js',
  '/assets/js/date-utils.js',
  '/assets/js/daily-focus-utils.js',
  '/assets/js/pwa.js',
  '/assets/js/motion.js',
  '/assets/js/image-utils.js',
  '/assets/js/activity-utils.js',
  '/assets/js/wellness-utils.js',
  '/assets/js/reminder-utils.js',
  '/assets/js/weight-utils.js',
  '/assets/js/roadmap-utils.js',
  '/assets/js/plan-calibration-utils.js',
  '/assets/js/food-entry-utils.js',
  '/assets/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('fitai-shell-') && key !== CACHE_VERSION)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isPrivateOrRemoteRequest(request, url) {
  return request.method !== 'GET'
    || url.origin !== self.location.origin
    || url.pathname.startsWith('/api/');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (isPrivateOrRemoteRequest(event.request, url)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => (
          (await caches.match(event.request))
          || (await caches.match('/offline.html'))
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/profile';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
        if (existing) {
          existing.navigate(targetUrl);
          return existing.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
