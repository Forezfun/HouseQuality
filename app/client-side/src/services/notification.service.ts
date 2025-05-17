import { Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class NotificationService{

  private errorSubject = new BehaviorSubject<string>('');
  private successSubject = new BehaviorSubject<string>('');

  error$ = this.errorSubject.asObservable();
  success$ = this.successSubject.asObservable();

  setError(message: string,delay:number) {
    this.errorSubject.next(message);
    setTimeout(()=>this.clearError(),delay)
  }
  setSuccess(message: string,delay:number) {
    this.successSubject.next(message);
    setTimeout(()=>this.clearError(),delay)
  }

  private clearError() {
    this.errorSubject.next('');
    this.successSubject.next('');
  }
}
