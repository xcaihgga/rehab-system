/* 康复病历工作台 Service Worker
   策略：预缓存核心壳文件（HTML/manifest/sw/图标），动态缓存同源资源
   版本变更会触发新缓存名，旧缓存 activate 时清理
*/
var CACHE_VERSION = 'rehab-desk-v1';
var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// install：预缓存核心壳 + 等待激活
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function() {
        // 某个资源预缓存失败不阻塞 install
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// activate：清理旧版本缓存 + 立即接管
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// message：支持页面发来的 SKIP_WAITING（新版本确认后立即激活）
self.addEventListener('message', function(e) {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// fetch：同源资源 cache-first，离线兜底到 index.html
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  // 只拦截同源请求，不碰外链字体/CDN
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      // 没缓存 → 网络取，成功则存缓存
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200) {
          var respClone = resp.clone();
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(e.request, respClone).catch(function() {});
          });
        }
        return resp;
      }).catch(function() {
        // 离线兜底：页面请求返回 index.html
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
