const CACHE_NAME = 'house-quality-cache-v2'; 
const DB_NAME = 'large-files-cache';
const STORE_NAME = 'files';

self.importScripts('https:


async function saveToIndexedDB(request, response) {
  const db = await idb.openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });

  const blob = await response.blob();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(blob, request.url);
  await tx.done;
}


async function getFromIndexedDB(request) {
  const db = await idb.openDB(DB_NAME);
  return db.get(STORE_NAME, request.url);
}


self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  
  if (event.request.method !== 'GET') {
    return;
  }

  
  if (url.includes('/api/furniture/model')) {
    event.respondWith(
      getFromIndexedDB(event.request).then((cachedResponse) => {
        return cachedResponse
          ? new Response(cachedResponse) 
          : fetch(event.request).then(async (response) => {
              if (!response.ok) {
                return response; 
              }
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
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

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
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );

      
      const db = await idb.openDB(DB_NAME, 1);
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await tx.store.clear();
      await tx.done;
    })()
  );
});
