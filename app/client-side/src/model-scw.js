importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb/build/iife/index-min.js');

const { registerRoute } = workbox.routing;
const openDB = idb.openDB;

const DB_NAME = 'FurnitureModelsDB';
const DB_VERSION = 2;
const MODEL_STORE = 'modelStore';
const MAX_CACHE_SIZE = 2 * 1024 * 1024 * 1024; // 2 ГБ

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(MODEL_STORE)) {
        db.createObjectStore(MODEL_STORE, { keyPath: 'furnitureCardId' });
      }
    }
  });
}

async function getCachedModel(furnitureCardId) {
  const db = await getDB();
  return db.get(MODEL_STORE, furnitureCardId);

}

async function putCachedModel(furnitureCardId, versionModel, blob) {
  const db = await getDB();
  await db.put(MODEL_STORE, {
    furnitureCardId,
    versionModel,
    blob,
    sizeInBytes: blob.size,
    lastAccessed: Date.now()
  });
  console.log('[SW] Модель закеширована:', furnitureCardId);
  console.log('[SW] Mime-type модели:', blob.type)
  await enforceCacheLimit();
}

async function enforceCacheLimit() {
  const db = await getDB();
  const tx = db.transaction(MODEL_STORE, 'readwrite');
  const store = tx.store;
  const allItems = await store.getAll();
  let totalSize = allItems.reduce((acc, item) => acc + (item.sizeInBytes || 0), 0);

  if (totalSize <= MAX_CACHE_SIZE) return;

  allItems.sort((a, b) => a.lastAccessed - b.lastAccessed);

  for (const item of allItems) {
    await store.delete(item.furnitureCardId);
    totalSize -= item.sizeInBytes || 0;
    console.log('[SW] Удалена старая модель из кеша:', item.furnitureCardId);
    if (totalSize <= MAX_CACHE_SIZE) break;
  }

  await tx.done;
}

async function fetchVersionFromServer(furnitureCardId) {
  try {
    const response = await fetch(`/api/furniture/model/version?furnitureCardId=${furnitureCardId}`);
    if (!response.ok) throw new Error('Ошибка запроса версии модели');
    const data = await response.json();
    return data.versionModel;
  } catch (e) {
    console.warn('[SW] Не удалось получить версию модели:', e.message);
    return null;
  }
}

registerRoute(
  ({ url, request }) =>
    url.pathname === '/api/furniture/model' &&
    url.searchParams.has('furnitureCardId') &&
    request.method === 'GET',
  async ({ url, event }) => {
    const furnitureCardId = url.searchParams.get('furnitureCardId');

    try {
      const serverVersion = await fetchVersionFromServer(furnitureCardId);
      const cached = await getCachedModel(furnitureCardId);


      if (cached && cached.versionModel === serverVersion) {
        console.log('[SW] Отдаём модель из кеша:', furnitureCardId);
        await updateAccessTime(furnitureCardId);
        return new Response(cached.blob);
      }

      console.log('[SW] Загружаем модель с сервера:', furnitureCardId);
      const networkResponse = await fetch(event.request);
      if (!networkResponse.ok) throw new Error('Ошибка загрузки модели');
      const blob = await networkResponse.blob();

      await putCachedModel(furnitureCardId, serverVersion, blob);

      return new Response(blob, {
        headers: { 'Content-Type': 'model/obj' }
      });
    } catch (e) {
      console.error('[SW] Ошибка в обработке модели:', e.message);
      return fetch(event.request);
    }
  }
);

async function updateAccessTime(furnitureCardId) {
  const db = await getDB();
  const tx = db.transaction(MODEL_STORE, 'readwrite');
  const store = tx.store;
  const item = await store.get(furnitureCardId);
  if (item) {
    item.lastAccessed = Date.now();
    await store.put(item);
  }
  await tx.done;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  clients.claim();
});
