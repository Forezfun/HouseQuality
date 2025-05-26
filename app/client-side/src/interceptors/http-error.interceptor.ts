import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  /**
   * Конструктор интерсептора ошибок HTTP
   * @param notification Сервис уведомлений для отображения ошибок
   */
  constructor(
    private notification: NotificationService,
  ) {}

  /**
   * Перехватчик HTTP-запросов для обработки ошибок
   * @param request HTTP-запрос
   * @param next Обработчик HTTP-запроса
   * @returns Observable с HTTP-событиями, с обработкой ошибок
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.notification.setError(error.error.message, 5000);
        return throwError(() => error);
      })
    );
  }
}
