const CACHE = 'poma-shift-v0.1.38';
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
  './character-progression-v2.js',
  './character-art.js',
  './launch-polish.js',
  './boss-ui.js',
  './timed-level-guard.js',
  './analytics-bridge.js',
  './dev-panel.js',
  './combo-system.js',
  './rush-mode.js',
  './rush-continue.js',
  './rush-runtime-guard.js',
  './ui-hotfix.js',
  './audio-mix.js',
  './poma-sports-loop.mp3',
  './GAME_SPEC.md',
  './META_SPEC.md',
  './RUSH_RULES.md',
  '../../assets/brand/poma-academy/poma-main-wave.png',
  '../../assets/brand/poma-academy/poma-genius.png',
  '../../assets/brand/poma-academy/poma-influencer.png',
  '../../assets/brand/poma-academy/poma-archer.png',
  '../../assets/brand/poma-academy/poma-wolf.png',
  '../../assets/brand/poma-academy/poma-baby.png',
  '../../assets/brand/poma-academy/poma-elder.png',
  '../../assets/brand/poma-academy/fire poma.png',
  '../../assets/brand/poma-academy/poma-hero.png',
  '../../assets/brand/poma-academy/poma-sad.png',
  '../../assets/brand/poma-academy/sugar-cloud.png',
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

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const destination = event.request.destination;
  const freshCode = event.request.mode === 'navigate' || destination === 'document' || destination === 'script' || destination === 'style';
  event.respondWith(freshCode ? networkFirst(event.request) : cacheFirst(event.request));
});