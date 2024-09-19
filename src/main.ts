import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/client-side/app.config';
import { AppComponent } from './app/client-side/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
