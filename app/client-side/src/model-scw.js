const DB_NAME = 'FurnitureModelsDB';
const DB_VERSION = 2;
const MODEL_STORE = 'modelStore';
const MAX_CACHE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

self.addEventListener('install', event => {
  console.log('[SW] Install event');
  // Skip waiting to activate immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Initialize database
      openDB().then(db => db.close())
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only intercept requests for model files
  if (url.pathname === '/api/furniture/model' &&
    url.searchParams.has('furnitureCardId') &&
    event.request.method === 'GET') {
    event.respondWith(
      handleModelRequest(event.request).catch(err => {
        console.error('[SW] Ошибка обработки запроса:', err);
        return fetch(event.request); // Fallback к сети
      })
    );
  }
  // Let all other requests go to network
});

async function handleModelRequest(request) {
  const url = new URL(request.url);
  const furnitureCardId = url.searchParams.get('furnitureCardId');
  console.log('[SW] Запрос модели для furnitureCardId:', furnitureCardId);

  try {
    // 1. Проверяем версию
    const versionUrl = `/api/furniture/model/version?furnitureCardId=${furnitureCardId}`;
    console.log('[SW] Запрос версии:', versionUrl);
    
    const versionRes = await fetch(versionUrl);
    console.log('[SW] Ответ версии:', versionRes.status, versionRes.ok);

    if (!versionRes.ok) {
      throw new Error(`Ошибка HTTP: ${versionRes.status}`);
    }

    const versionData = await versionRes.json();
    console.log('[SW] Данные версии:', versionData);

    // 2. Проверяем кеш
    const db = await openDB();
    const cached = await dbGetModel(db, furnitureCardId);
    console.log('[SW] Данные из кеша:', cached);

    if (cached && cached.versionModel === versionData.versionModel) {
      console.log('[SW] Возвращаем модель из кеша');
      return new Response(cached.blob, { headers: { 'Content-Type': 'model/obj' } });
    }

    // 3. Загружаем новую модель
    console.log('[SW] Загрузка новой модели...');
    const modelRes = await fetch(request);
    if (!modelRes.ok) throw new Error(`Ошибка загрузки модели: ${modelRes.status}`);

    const blob = await modelRes.blob();
    console.log('[SW] Размер модели:', blob.size, 'байт');

    // 4. Сохраняем в кеш
    await dbPutModel(db, furnitureCardId, versionData.versionModel, blob);
    console.log('[SW] Модель закеширована');

    return new Response(blob, { headers: { 'Content-Type': 'model/obj' } });

  } catch (err) {
    console.error('[SW] Ошибка в handleModelRequest:', err);
    throw err; // Перебрасываем ошибку в основной catch
  }
}

// Database functions (unchanged from your original)
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
    req.onerror = e => reject(e.target.error);
  });
}

function dbGetModel(db, furnitureCardId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readonly');
    const store = tx.objectStore(MODEL_STORE);
    const req = store.get(furnitureCardId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbPutModel(db, furnitureCardId, versionModel, blob) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readwrite');
    const store = tx.objectStore(MODEL_STORE);
    const entry = {
      furnitureCardId,
      versionModel,
      blob,
      sizeInBytes: blob.size,
      lastAccessed: Date.now()
    };
    store.put(entry);
    tx.oncomplete = () => {
      enforceStorageLimit(db).then(resolve).catch(reject);
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function enforceStorageLimit(db) {
  const entries = await getAllModels(db);
  let total = entries.reduce((sum, e) => sum + e.sizeInBytes, 0);

  if (total <= MAX_CACHE_SIZE_BYTES) return;

  // Sort by oldest access first
  const sorted = entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
  while (total > MAX_CACHE_SIZE_BYTES && sorted.length > 0) {
    const toDelete = sorted.shift();
    await deleteModel(db, toDelete.furnitureCardId);
    total -= toDelete.sizeInBytes;
  }
}

function getAllModels(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readonly');
    const store = tx.objectStore(MODEL_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteModel(db, furnitureCardId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, 'readwrite');
    tx.objectStore(MODEL_STORE).delete(furnitureCardId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}