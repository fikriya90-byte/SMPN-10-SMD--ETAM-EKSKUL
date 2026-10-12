const CACHE = 'etam-v6-cache';
const ASSETS = [
  './', './index.html', './style.css', './manifest.json',
  './js/icons.js', './js/config.js', './js/helpers.js', './js/storage.js',
  './js/photo.js', './js/auth.js', './js/nav.js',
  './js/routes-notifikasi.js', './js/routes-password.js', './js/routes-export.js',
  './js/routes-admin.js', './js/routes-guru.js', './js/routes-murid.js',
  './js/routes-kas.js', './js/routes-struktur.js', './js/routes-laporan.js',
  './js/init.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
