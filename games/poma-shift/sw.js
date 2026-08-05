const CACHE = 'poma-shift-v0.1.28';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './threat.css',
  './poma-brand.css',
  './state-palette.css',
  './meta-system.css',
  './character-art.css',
  './launch-polish.css',
  './boss-ui.css',
  './dev-panel.css',
  './game.js',
  './mobile-layout.js',
  './game-feel.js',
  './rush-disable.js',
  './product-ui.js',
  './win-reveal.js',
  './threat-system.js',
  './timer-heartbeat.js',
  './poma-brand.js',
  './meta-system.js',
  './character-art.js',
  './launch-polish.js',
  './boss-ui.js',
  './timed-level-guard.js',
  './analytics-bridge.js',
  './dev-panel.js',
  './combo-system.js',
  './rush-mode.js',
  './ui-hotfix.js',
  './audio-mix.js',
  './poma-sports-loop.mp3',
  './GAME_SPEC.md',
  './META_SPEC.md',
  './RUSH_RULES.md',
  '../../assets/brand/poma-academy/poma-main-wave.png',
  '../../assets/brand/poma-academy/poma-shift-character-sprite.webp',
  '../../assets/brand/poma-academy/poma-sad.png',
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
