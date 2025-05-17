import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
import { modelInterface } from '../components/scene/scene.component';
export interface queryData {
  name?: string;
  [key: string]: string | undefined | optionSelectQueryData | optionRangeQueryData;
}
interface optionSelectQueryData {
  type: 'select';
  value: string;
}
interface optionRangeQueryData {
  type: 'range';
  min: number;
  max: number;
}
export interface furnitureShopData {
  name: string;
  cost: number;
  previewUrl: string;
  furnitureId: string;
  colors: string[];
  proportions: modelInterface;
}
export interface clientFilters {
  colors: string[];
  minCost: number;
  maxCost: number;
}
@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private baseServiceUrl = baseUrl + 'shop/'
  constructor(
    private httpModule: HttpClient
  ) { }
  private abortController: AbortController | null = null;

  async GETgetCategoryData(categoryName: string, startRange: number, queryData?: queryData) {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      let requestUrl = `${this.baseServiceUrl}category?category=${categoryName}&startRange=${startRange}`

      if (queryData && Object.keys(queryData).length > 0) {
        const params = new URLSearchParams();
        params.append('filters', JSON.stringify(queryData));
        requestUrl += `&${new URLSearchParams(params).toString()}`
      }
      const response = await fetch(
        requestUrl,
        { signal: this.abortController.signal }
      )

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка: ${response.status} — ${errorText}`);
      }

      const RESPONSE = await response.json() as { resultsArray: furnitureShopData[] }
      const RESULTS_ARRAY = RESPONSE.resultsArray

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

  private getFindOptionsByResult(resultsArray: furnitureShopData[]) {
    let filtersObject: clientFilters = {
      colors: [],
      minCost: Infinity,
      maxCost: -Infinity
    }
    resultsArray.forEach(furnitureData => {
      if (furnitureData.cost < filtersObject.minCost) filtersObject.minCost = furnitureData.cost
      if (furnitureData.cost > filtersObject.maxCost) filtersObject.maxCost = furnitureData.cost

      filtersObject.colors.push(...furnitureData.colors)
    })
    filtersObject.colors = [...new Set(filtersObject.colors)]
    return filtersObject
  }
}
