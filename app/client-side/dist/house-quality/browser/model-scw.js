const DB_NAME = 'FurnitureModelsDB';
const DB_VERSION = 2;
const MODEL_STORE = 'modelStore';
const MAX_CACHE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

self.addEventListener('install', event => {
  event.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.skipWaiting()
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/api/furniture/model' &&
    url.searchParams.has('furnitureCardId') &&
    event.request.method === 'GET') {
    event.respondWith(
      handleModelRequest(event.request).catch(err => {
        console.error('[SW] Ошибка обработки запроса:', err);
        return fetch(event.request);
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

async function handleModelRequest(request) {
  const url = new URL(request.url);
  const furnitureCardId = url.searchParams.get('furnitureCardId');

  const versionRes = await fetch(`/api/furniture/model/version?furnitureCardId=${furnitureCardId}`);
  if (!versionRes.ok) return fetch(request);

  const { versionModel } = await versionRes.json();
  const db = await openDB();

  const cached = await dbGetModel(db, furnitureCardId);
  if (cached && cached.versionModel === versionModel) {
    return new Response(cached.blob, {
      headers: {
        'Content-Type': 'model/obj',
        'Content-Disposition': 'attachment; filename="model.obj"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  const modelRes = await fetch(request);
  const blob = await modelRes.blob();

  dbPutModel(db, furnitureCardId, versionModel, blob)
    .then(result => console.log('[SW] файл закеширован:',result))
    .catch(err => console.error('[SW] Ошибка кеширования:', err))

  return new Response(blob, {
    headers: {
      'Content-Type': 'model/obj'
    }
  });
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(MODEL_STORE)) {
        db.createObjectStore(MODEL_STORE, { keyPath: 'furnitureCardId' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });
}

function dbGetModel(db, furnitureCardId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readonly');
    const store = tx.objectStore(MODEL_STORE);
    const req = store.get(furnitureCardId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

function dbPutModel(db, furnitureCardId, versionModel, blob) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readwrite');
    const store = tx.objectStore(MODEL_STORE);
    const sizeInBytes = blob.size;
    const entry = {
      furnitureCardId,
      versionModel,
      blob,
      sizeInBytes,
      requestCount: 1
    };
    store.put(entry);
    tx.oncomplete = () => {
      enforceStorageLimit(db).then(resolve).catch(reject);
    };
    tx.onerror = reject;
  });
}

function getAllModels(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readonly');
    const store = tx.objectStore(MODEL_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

async function enforceStorageLimit(db) {
  const entries = await getAllModels(db);
  let total = entries.reduce((sum, e) => sum + e.sizeInBytes, 0);

  if (total <= MAX_CACHE_SIZE_BYTES) return;

  const sorted = entries.sort((a, b) => a.requestCount - b.requestCount);
  while (total > MAX_CACHE_SIZE_BYTES && sorted.length > 0) {
    const toDelete = sorted.shift();
    await deleteModel(db, toDelete.furnitureCardId);
    total -= toDelete.sizeInBytes;
  }
}

function deleteModel(db, furnitureCardId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readwrite');
    tx.objectStore(MODEL_STORE).delete(furnitureCardId);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}
