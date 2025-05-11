import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/model-scw.js', { scope: '/' })
        .then(reg => {})
        .catch(err => {});
    }
  })
  .catch((error) => console.error(error));
