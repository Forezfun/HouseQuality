const CACHE_NAME = 'house-quality-cache-v1'; 

self.addEventListener('fetch', (event) => {
  
  if (event.request.url.includes('/api/furniture/model')) {
    event.respondWith(fetch(event.request)); 
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      
      if (response) return response;

      
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone()); 
          return networkResponse;
        });
      });
    })
  );
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); 
          }
        })
      );
    })
  );
});
