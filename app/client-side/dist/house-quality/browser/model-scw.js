const DB_NAME = 'FurnitureModelsDB';
const DB_VERSION = 2;
const META_STORE = 'metaStore';
const CHUNK_STORE = 'chunkStore';
const MAX_CACHE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

self.addEventListener('install', event => {
  event.skipWaiting()
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.skipWaiting()
      .then(() => clients.claim())
      .then(() => self.clients.matchAll())
      .then(clients => {
      })
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
  if (!versionRes.ok) {
    return fetch(request);
  }

  const { versionModel } = await versionRes.json();
  const db = await openDB();

  const meta = await dbGetMeta(db, furnitureCardId);
  if (meta && meta.versionModel === versionModel) {
    const chunks = await dbGetChunks(db, furnitureCardId, meta.chunkCount);
    const blob = new Blob(chunks);

    return new Response(blob, {
      headers: {
        'Content-Type': 'model/obj',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Disposition': 'attachment; filename="model.obj"'
      }
    });
  }

  const modelRes = await fetch(request);
  const blob = await modelRes.blob();

  dbPutModel(db, furnitureCardId, versionModel, await blobToChunks(blob), blob.size)
    .catch(err => console.error('[SW] Ошибка кеширования:', err));

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
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'furnitureCardId' });
      }
      if (!db.objectStoreNames.contains(CHUNK_STORE)) {
        db.createObjectStore(CHUNK_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });
}

function dbGetMeta(db, furnitureCardId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const req = store.get(furnitureCardId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

function dbGetChunks(db, furnitureCardId, count) {
  return Promise.all(
    Array.from({ length: count }, (_, i) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(CHUNK_STORE, 'readonly');
        const store = tx.objectStore(CHUNK_STORE);
        const req = store.get(`${furnitureCardId}_${i}`);
        req.onsuccess = () => resolve(req.result?.data);
        req.onerror = reject;
      });
    })
  );
}

function dbPutModel(db, furnitureCardId, versionModel, chunks, size) {
  return new Promise((resolve, reject) => {
    const txMeta = db.transaction(META_STORE, 'readwrite');
    const metaStore = txMeta.objectStore(META_STORE);
    metaStore.put({ furnitureCardId, versionModel, chunkCount: chunks.length, requestCount: 1, sizeInBytes: size });
    txMeta.oncomplete = () => {
      const txChunks = db.transaction(CHUNK_STORE, 'readwrite');
      const chunkStore = txChunks.objectStore(CHUNK_STORE);
      chunks.forEach((chunk, i) => {
        chunkStore.put({ id: `${furnitureCardId}_${i}`, furnitureCardId, chunkIndex: i, data: chunk });
      });
      txChunks.oncomplete = resolve;
      txChunks.onerror = reject;
    };
    txMeta.onerror = reject;
  });
}

function incrementRequestCount(db, furnitureCardId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);
    const req = store.get(furnitureCardId);
    req.onsuccess = () => {
      const data = req.result;
      if (!data) return resolve();
      data.requestCount += 1;
      store.put(data);
      tx.oncomplete = resolve;
    };
    req.onerror = reject;
  });
}

async function enforceStorageLimit(db) {
  const entries = await getAllMeta(db);
  let total = entries.reduce((sum, e) => sum + e.sizeInBytes, 0);

  if (total <= MAX_CACHE_SIZE_BYTES) return;

  const sorted = entries.sort((a, b) => a.requestCount - b.requestCount);
  while (total > MAX_CACHE_SIZE_BYTES && sorted.length > 0) {
    const toDelete = sorted.shift();
    await deleteModel(db, toDelete.furnitureCardId, toDelete.chunkCount);
    total -= toDelete.sizeInBytes;
  }
}

function getAllMeta(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

async function deleteModel(db, furnitureCardId, chunkCount) {
  const tx1 = db.transaction(CHUNK_STORE, 'readwrite');
  const chunkStore = tx1.objectStore(CHUNK_STORE);
  for (let i = 0; i < chunkCount; i++) {
    chunkStore.delete(`${furnitureCardId}_${i}`);
  }
  await txComplete(tx1);

  const tx2 = db.transaction(META_STORE, 'readwrite');
  const metaStore = tx2.objectStore(META_STORE);
  metaStore.delete(furnitureCardId);
  await txComplete(tx2);
}

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

function blobToChunks(blob, chunkSize = 5 * 1024 * 1024) {
  return new Promise(resolve => {
    const chunks = [];
    let offset = 0;
    while (offset < blob.size) {
      const slice = blob.slice(offset, offset + chunkSize);
      chunks.push(slice);
      offset += chunkSize;
    }
    resolve(chunks);
  });
}