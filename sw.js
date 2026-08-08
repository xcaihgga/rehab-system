var CACHE_NAME='rehab-v3.9.3';
var ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','js/bootstrap.js','js/utils.js','js/storage-sync.js','js/schema.js','js/data-model.js','js/dirty-router.js','js/route-handlers.js'];
self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS).catch(function(){});
    }).then(function(){
      return self.skipWaiting();
    })
  );
});
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k!==CACHE_NAME)return caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});
// 响应页面发来的 SKIP_WAITING 消息，立即激活新 SW
self.addEventListener('message',function(e){
  if(e.data==='SKIP_WAITING'){
    self.skipWaiting();
  }
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached)return cached;
      return fetch(e.request).then(function(resp){
        if(resp&&resp.status===200&&e.request.url.startsWith(self.location.origin)){
          var respClone=resp.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request,respClone).catch(function(){});
          });
        }
        return resp;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});