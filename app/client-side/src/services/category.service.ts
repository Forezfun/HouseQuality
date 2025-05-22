import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';

/**
 * Данные категории
 */
export interface categoryData {
  /** Название категории */
  name: string;
  /** Перевод категории в единственном числе */
  translateOne: string;
  /** Перевод категории во множественном числе */
  translateMany: string;
  /** Массив фильтров категории */
  filters: filter[];
}

/**
 * Базовый фильтр
 */
interface baseFilter {
  /** Имя фильтра */
  name: string;
  /** Поле, по которому фильтр */
  field: string;
}

/**
 * Опция для select-фильтра
 */
export interface option {
  /** Название опции */
  name: string;
  /** Значение опции для запроса */
  queryValue: string;
}

/**
 * Фильтр типа select
 */
interface selectFilter extends baseFilter {
  /** Тип фильтра */
  type: 'select';
  /** Варианты выбора */
  options: option[];
}

/**
 * Фильтр типа range
 */
interface rangeFilter extends baseFilter {
  /** Тип фильтра */
  type: 'range';
  /** Минимальное значение */
  minValue: number;
  /** Максимальное значение */
  maxValue: number;
}

/**
 * Тип фильтра: select или range
 */
export type filter = rangeFilter | selectFilter;

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  /** Базовый URL для работы с категориями */
  private baseServiceUrl = baseUrl + 'category';

  constructor(
    private httpModule: HttpClient
  ) { }

  /**
   * Получение всех категорий
   * @returns Promise с массивом категорий
   */
  GETgetAllCategories() {
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl)) as Promise<{ categoryArray: categoryData[] }>;
  }
}
