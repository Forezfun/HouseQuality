import { Inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { from, Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class ModelCacheInterceptor implements HttpInterceptor {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('/furniture/model/') && req.params.has('furnitureCardId')) {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {

        const url = new URL(req.url, this.document.location.origin);
        return from(fetch(url.toString(), {
          headers: req.headers.keys()
            .reduce((acc, key) => ({ ...acc, [key]: req.headers.get(key) }), {})
        })).pipe(
          switchMap(response => response.ok 
            ? of(new HttpResponse({ body: response.body, status: response.status }))
            : throwError(() => new HttpErrorResponse({ status: response.status }))
          )
        );
      }
    }
    return next.handle(req);
  }
}