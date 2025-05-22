import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
import { modelInterface } from '../components/scene/scene.component';

/**
 * Интерфейс объекта фильтров, отправляемых на сервер.
*/
export interface queryData {
  /** Любое ключ:значение */
  [key: string]: optionSelectQueryData | optionRangeQueryData;
}

/**
 * Фильтр типа "выбор из списка".
 */
interface optionSelectQueryData {
  /** Тип фильтра */
  type: 'select';
  /** Выбранные значения */
  value: string[];
}

/**
 * Фильтр типа "диапазон значений".
*/
interface optionRangeQueryData {
  /** Тип фильтра */
  type: 'range';
  /** Минимум в диапазоне */
  min: number;
  /** Максимум в диапазоне */
  max: number;
}

/**
 * Интерфейс данных о мебели, получаемых из магазина.
 */
export interface furnitureShopData {
  /** Название */
  name: string;
  /** Стоимость мебели */
  cost: number;
  /** Неполный Url превью (вначало надо вставить baseUrl сервера) */
  previewUrl: string;
  /** Id мебели */
  furnitureCardId: string;
  /** Массив цветов мебели */
  colors: string[];
  /** Габариты мебели */
  proportions: modelInterface;
}

/**
 * Интерфейс клиентских фильтров, значения которых формируются на основе ответа от сервера.
 */
export interface clientFilters {
  /** Цвета мебели */
  colors: string[];
  /** Минимальная стоимость */
  minCost: number;
  /** Максимальная стоимость */
  maxCost: number;
}

/**
 * Сервис для получения данных о мебели из магазина, с учетом фильтрации и пагинации.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopService {
  /** Базовый URL сервиса */
  private baseServiceUrl = baseUrl + 'shop';

  /** Активный AbortController для отмены предыдущих запросов */
  private abortController: AbortController | null = null;

  constructor(private httpModule: HttpClient) { }

  /**
   * Выполняет GET-запрос на получение данных по категории мебели.
   * Поддерживает фильтрацию и стартовую позицию для пагинации.
   * При повторном вызове отменяет предыдущий запрос.
   *
   * @param categoryName - Название категории мебели.
   * @param startRange - Начальный индекс (offset) выборки.
   * @param queryData - Объект фильтров (опционально).
   *
   * @returns Промис с объектом, содержащим:
   * - `resultsArray`: массив карточек мебели с обновлёнными URL превью
   * - `resultsClientFiltersData`: агрегированные данные фильтров для клиента
   *
   * @throws {Error} В случае сетевой ошибки или отмены запроса.
   */
  async GETgetCategoryData(categoryName: string, startRange: number, queryData?: queryData) {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      let requestUrl = `${this.baseServiceUrl}?category=${categoryName}&startRange=${startRange}`;

      if (queryData && Object.keys(queryData).length > 0) {
        const params = new URLSearchParams();
        params.append('filters', JSON.stringify(queryData));
        requestUrl += `&${new URLSearchParams(params).toString()}`;
      }

      const response = await fetch(
        requestUrl,
        { signal: this.abortController.signal }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка: ${response.status} — ${errorText}`);
      }

      const RESPONSE = await response.json() as { resultsArray: furnitureShopData[] };
      const RESULTS_ARRAY = RESPONSE.resultsArray;

      const UPDATED_RESULTS = RESULTS_ARRAY.map(furniture => ({
        ...furniture,
        previewUrl: baseUrl + furniture.previewUrl
      }));

      return {
        resultsArray: UPDATED_RESULTS,
        resultsClientFiltersData: this.getFindOptionsByResult(UPDATED_RESULTS)
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
      } else {
        console.error('Ошибка запроса:', error);
      }
      throw error;
    }
  }

  /**
   * Формирует объект фильтров на основе полученных данных о мебели.
   *
   * @param resultsArray - Массив карточек мебели
   * @returns Объект клиентских фильтров (цвета, минимальная и максимальная цена)
   */
  private getFindOptionsByResult(resultsArray: furnitureShopData[]) {
    let filtersObject: clientFilters = {
      colors: [],
      minCost: Infinity,
      maxCost: -Infinity
    };

    resultsArray.forEach(furnitureData => {
      if (furnitureData.cost < filtersObject.minCost) filtersObject.minCost = furnitureData.cost;
      if (furnitureData.cost > filtersObject.maxCost) filtersObject.maxCost = furnitureData.cost;

      filtersObject.colors.push(...furnitureData.colors);
    });

    filtersObject.minCost = filtersObject.minCost!== Infinity ? filtersObject.minCost : 0;
    filtersObject.maxCost = filtersObject.maxCost!== -Infinity ? filtersObject.maxCost : 0;

    filtersObject.colors = [...new Set(filtersObject.colors)];
    return filtersObject;
  }
}
