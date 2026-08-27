const VERSION = 'rpt-v3';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = [
  '/', '/?v=1', '/offline.html', '/manifest.webmanifest', '/icons/icon.svg',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
  '/assets/pedal-tape-hero-720.webp', '/assets/pedal-tape-hero.avif', '/assets/pedal-tape-hero.webp', '/assets/pedal-tape-hero.jpg',
  '/privacy/', '/terms/'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(PRECACHE);
    const response = await fetch('/');
    const html = await response.clone().text();
    const bundles = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
    await cache.put('/', response);
    await cache.addAll(bundles);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, ASSETS].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(SHELL).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(async () => (await caches.match(event.request)) || (url.pathname === '/privacy/' || url.pathname === '/terms/' ? caches.match(url.pathname) : caches.match('/')) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(ASSETS).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
