/**
 * Tractor PWA Service Worker (智能版本管理版)
 * 目标：只需修改 game/update.js 即可触发全量 JS 更新，同时保留图片/音频长期缓存。
 */

const urlParams = new URLSearchParams(self.location.search);
const VERSION = urlParams.get('v') || 'initial';

// 定义两个缓存池
const CACHE_CODE = 'tractor-code-' + VERSION; // 存放 JS, HTML (随版本变化)
const CACHE_MEDIA = 'tractor-media-v1';        // 存放图片、音频 (长期保留)

// 安装阶段：跳过等待，立即激活
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 激活阶段：清理旧的代码缓存池
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // 如果是代码缓存且版本不对，则删除
                    if (key.startsWith('tractor-code-') && key !== CACHE_CODE) {
                        console.log('[SW] 清理旧代码缓存:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. 特赦令：index.html 和 update.js 永远【网络优先】
    // 确保浏览器每次都能发现服务器上的 update.js 变了
    if (url.pathname.endsWith('index.html') || url.pathname.endsWith('update.js') || url.pathname === '/' || url.pathname.endsWith('/tractor/')) {
        event.respondWith(
            fetch(event.request).then(response => {
                // 在线时，顺便更新一下当前版本的代码缓存池（仅限 index.html）
                if (response.status === 200 && (url.pathname.endsWith('index.html') || url.pathname === '/')) {
                    const copy = response.clone();
                    caches.open(CACHE_CODE).then(cache => cache.put(event.request, copy));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. 媒体资源（图片、音频、字体、主题）：【缓存优先】
    const isMedia = /\.(png|jpg|jpeg|gif|webp|mp3|wav|ogg|ttf|woff|css)$/i.test(url.pathname) || url.pathname.includes('/theme/');
    if (isMedia) {
        event.respondWith(
            caches.open(CACHE_MEDIA).then((cache) => {
                return cache.match(event.request).then((response) => {
                    return response || fetch(event.request).then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // 抓取失败时（如断网或页面正在卸载），静默失败以防控制台报错
                        return new Response('', { status: 408, statusText: 'Network request failed' });
                    });
                });
            })
        );
        return;
    }

    // 3. 其他资源（主要是 JS 模块）：【缓存优先】
    // 注意：因为我们只要改了版本号，整个 CACHE_CODE 就会被清空，
    // 所以这里放心地使用缓存优先，能极大提升加载速度。
    event.respondWith(
        caches.open(CACHE_CODE).then((cache) => {
            return cache.match(event.request).then((response) => {
                return response || fetch(event.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // 抓取失败时（如断网或页面正在卸载），静默失败以防控制台报错
                    return new Response('', { status: 408, statusText: 'Network request failed' });
                });
            });
        })
    );
});
