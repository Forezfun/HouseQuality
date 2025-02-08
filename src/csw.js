const CACHE_NAME = 'house-quality-cache-v2';
const DB_NAME = 'large-files-cache';
const STORE_NAME = 'files';

importScripts('https://cdn.jsdelivr.net/npm/idb@7.1.1/build/umd.js');

async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

async function saveToIndexedDB(request, response) {
    try {
        const db = await idb.openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });

        const blob = await response.blob();
        const hashedKey = await hashString(request.url);

        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.store.put(blob, hashedKey);
        await tx.done;
    } catch (error) {
        console.error('Error saving to IndexedDB:', error);
    }
}

async function getFromIndexedDB(request) {
    try {
        const db = await idb.openDB(DB_NAME);
        const hashedKey = await hashString(request.url);
        return await db.get(STORE_NAME, hashedKey);
    } catch (error) {
        console.error('Error retrieving from IndexedDB:', error);
        return null;
    }
}

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = event.request.url;
    console.log(url)
    if (url.includes('/api/furniture/model')) {
        event.respondWith(
            getFromIndexedDB(event.request).then((cachedResponse) => {
                return cachedResponse
                    ? new Response(cachedResponse)
                    : fetch(event.request).then(async (response) => {
                        if (!response.ok) return response;
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
