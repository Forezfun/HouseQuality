import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('app/client-side/csw.js')
        .then(reg => console.log('Service Worker зарегистрирован:', reg))
        .catch(err => console.error('Ошибка регистрации Service Worker:', err));
    }
  })
  .catch((err) => console.error(err));
