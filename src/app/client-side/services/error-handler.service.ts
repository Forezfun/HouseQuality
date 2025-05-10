import { Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService{

  private errorSubject = new BehaviorSubject<string>('');

  error$ = this.errorSubject.asObservable();

  setError(message: string,delay:number) {
    this.errorSubject.next(message);
    setTimeout(()=>this.clearError(),delay)
  }

  private clearError() {
    this.errorSubject.next('');
  }
}
