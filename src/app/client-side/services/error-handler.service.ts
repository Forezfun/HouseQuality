import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  private errorSubject = new BehaviorSubject<string>('');
  
  // Observable для получения сообщения об ошибке
  error$ = this.errorSubject.asObservable();

  // Метод для установки сообщения об ошибке
  setError(message: string) {
    this.errorSubject.next(message);
  }

  // Метод для очистки ошибки
  clearError() {
    this.errorSubject.next('');
  }
}
