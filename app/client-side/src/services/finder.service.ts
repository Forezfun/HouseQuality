import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FinderService {
  constructor(private httpModule: HttpClient) { }
  private inputFurnitureNameSubject = new BehaviorSubject<string>('');
  private baseServiceUrl = baseUrl + 'finder?q=';

  furnitureName$ = this.inputFurnitureNameSubject.asObservable();

  setFurnitureName(name:string){
    this.inputFurnitureNameSubject.next(name);
  }
  /**
   * Получение 10-ти или меньше найденых публикаций по строке
   * @param findString Запрос пользователя
   */
  GETfindFurnitures(findString: string) {
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + findString));
  }
}
