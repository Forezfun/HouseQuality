import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
@Injectable({
  providedIn: 'root'
})
export class FinderService {
  constructor(private httpModule: HttpClient) { }
  private baseUrl = baseUrl+'finder?q=';
  /**
   * Получение 10-ти или меньше найденых публикаций по строке
   * @param findString Запрос пользователя
   */
  GETfindFurnitures(findString:string): Promise<any> {
    return this.httpModule.get(this.baseUrl+findString).toPromise()
  }
}
