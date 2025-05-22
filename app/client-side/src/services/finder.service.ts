import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

/**
 * Сервис для поиска мебели по названию
 * @class FinderService
 * @injectable
 */
@Injectable({
  providedIn: 'root'
})
export class FinderService {

  /** Базовый URL для запросов поиска */
  private baseServiceUrl = baseUrl + 'find?q=';

  /** BehaviorSubject для хранения текущего названия мебели для поиска */
  private inputFurnitureNameSubject = new BehaviorSubject<string>('');

  /** Observable для подписки на изменения названия мебели */
  furnitureName$ = this.inputFurnitureNameSubject.asObservable();

  /**
   * Конструктор сервиса
   * @param httpModule - HTTP клиент для выполнения запросов
   */
  constructor(private httpModule: HttpClient) { }

  /**
   * Устанавливает текущее название мебели для поиска
   * @param name - Название мебели
   */
  setFurnitureName(name: string): void {
    this.inputFurnitureNameSubject.next(name);
  }

  /**
   * Выполняет поиск мебели по названию, возвращая до 10 найденных публикаций
   * @param query - Строка запроса поиска
   * @returns Promise с результатами поиска (массив публикаций или любая структура, возвращаемая сервером)
   */
  GETfindFurnitures(query: string): Promise<any> {
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + query));
  }
}
