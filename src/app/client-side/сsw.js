const CACHE_NAME = 'house-quality-cache-v1'; 
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/idb/7.1.1/idb.min.js');

const DB_NAME = 'large-files-cache';
const STORE_NAME = 'files';

async function saveToIndexedDB(request, response) {
  const db = await idb.openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });

  const blob = await response.blob();
  await db.put(STORE_NAME, blob, request.url);
}

async function getFromIndexedDB(request) {
  const db = await idb.openDB(DB_NAME);
  return await db.get(STORE_NAME, request.url);
}
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Если это файл > 200МБ (например, модели)
  if (url.includes('/api/furniture/model')) {
    event.respondWith(
      getFromIndexedDB(event.request).then((cachedResponse) => {
        return cachedResponse
          ? new Response(cachedResponse)
          : fetch(event.request).then(async (response) => {
              await saveToIndexedDB(event.request, response.clone());
              return response;
            });
      })
    );
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
