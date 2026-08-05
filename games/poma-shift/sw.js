const CACHE = 'poma-shift-v0.1.14';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './threat.css',
  './poma-brand.css',
  './state-palette.css',
  './meta-system.css',
  './game.js',
  './mobile-layout.js',
  './game-feel.js',
  './product-ui.js',
  './win-reveal.js',
  './threat-system.js',
  './timer-heartbeat.js',
  './poma-brand.js',
  './meta-system.js',
  './GAME_SPEC.md',
  './META_SPEC.md',
  '../../assets/brand/poma-academy/poma-main-wave.png',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
