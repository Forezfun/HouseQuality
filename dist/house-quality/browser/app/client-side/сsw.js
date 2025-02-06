self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/furniture/model')) {
      event.respondWith(fetch(event.request)); // Отправляем запрос напрямую на сервер
      return;
    }
  
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  