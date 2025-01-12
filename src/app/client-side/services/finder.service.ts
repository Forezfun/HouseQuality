import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
HttpClient
@Injectable({
  providedIn: 'root'
})
export class FinderService {
  private baseUrl = 'http://localhost:8010/proxy/finder?q=';

  constructor(private httpModule: HttpClient) { }

  /**
   * Получение 10-ти или меньше найденых публикаций по строке
   * @param findString Запрос пользователя
   */
  GETfindFurnitures(findString:string): Promise<any> {
    return this.httpModule.get(this.baseUrl+findString).toPromise()
  }
}
