import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from './app.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    // provideServiceWorker('ngsw-worker.js', {
    //   enabled: !isDevMode(),
    //   registrationStrategy: 'registerImmediately'
    // })
  ]
};
bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
