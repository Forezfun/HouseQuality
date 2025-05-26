import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Сервис для управления уведомлениями об ошибках и успехах.
 * Позволяет подписываться на сообщения и автоматически очищать их через заданный промежуток времени.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  /** 
   * BehaviorSubject для ошибок, содержит строку с сообщением об ошибке или пустую строку.
   */
  private errorSubject = new BehaviorSubject<string>('');

  /** 
   * BehaviorSubject для успешных сообщений, содержит строку с сообщением успеха или пустую строку.
   */
  private successSubject = new BehaviorSubject<string>('');

  /** Observable для подписки на сообщения об ошибках */
  error$ = this.errorSubject.asObservable();

  /** Observable для подписки на успешные сообщения */
  success$ = this.successSubject.asObservable();

  /**
   * Устанавливает сообщение об ошибке и очищает его после задержки
   * @param message Текст ошибки для отображения
   * @param delay Задержка в миллисекундах перед автоматическим удалением сообщения
   */
  setError(message: string, delay: number): void {
    this.errorSubject.next(message);
    setTimeout(() => this.clearNotification(), delay);
  }

  /**
   * Устанавливает сообщение об успешном действии и очищает его после задержки
   * @param message Текст успешного сообщения
   * @param delay Задержка в миллисекундах перед автоматическим удалением сообщения
   */
  setSuccess(message: string, delay: number): void {
    this.successSubject.next(message);
    setTimeout(() => this.clearNotification(), delay);
  }

  /**
   * Очищает сообщения об ошибках и успехах
   * (устанавливает значения в пустую строку)
   */
  private clearNotification(): void {
    this.errorSubject.next('');
    this.successSubject.next('');
  }
}
