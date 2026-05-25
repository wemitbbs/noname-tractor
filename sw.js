// 基础 Service Worker，用于满足 PWA 安装要求
const CACHE_NAME = 'tractor-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 仅作为占位，实际逻辑可根据需要扩展
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
