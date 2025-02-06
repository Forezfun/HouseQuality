const CACHE_NAME = 'house-quality-cache-v2'; // Измени версию при обновлении кэша
const DB_NAME = 'large-files-cache';
const STORE_NAME = 'files';

self.importScripts('https://cdn.jsdelivr.net/npm/idb@7.1.1/build/umd.js');


// Функция сохранения больших файлов в IndexedDB
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

// Функция получения файлов из IndexedDB
async function getFromIndexedDB(request) {
  const db = await idb.openDB(DB_NAME);
  return db.get(STORE_NAME, request.url);
}

// Обработчик запросов
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Исключение: не кэшируем POST, PUT, DELETE
  if (event.request.method !== 'GET') {
    return;
  }

  // Кеширование больших файлов (например, 3D-моделей)
  if (url.includes('/api/furniture/model')) {
    event.respondWith(
      getFromIndexedDB(event.request).then((cachedResponse) => {
        return cachedResponse
          ? new Response(cachedResponse) // Если есть в IndexedDB — возвращаем
          : fetch(event.request).then(async (response) => {
              if (!response.ok) {
                return response; // Если сервер вернул ошибку, не кэшируем
              }
              await saveToIndexedDB(event.request, response.clone());
              return response;
            });
      })
    );
    return;
  }

  // Обычное кэширование статических файлов
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response; // Если есть в кэше — возвращаем

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

// Удаление старых кэшей и IndexedDB при обновлении Service Worker
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

      // Удаляем старые записи из IndexedDB (чтобы не накапливался мусор)
      const db = await idb.openDB(DB_NAME, 1);
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await tx.store.clear();
      await tx.done;
    })()
  );
});
