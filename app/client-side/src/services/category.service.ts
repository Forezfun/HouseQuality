import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom, Observable } from 'rxjs';
export interface categoryData {
  name: string;
  translateOne: string;
  translateMany: string;
  filters: filter[]
}
interface baseFilter {
  name: string;
  field: string;
}
export interface option {
  name: string;
  queryValue: string
}
interface selectFilter extends baseFilter {
  type: 'select'
  options: option[]
}
interface rangeFilter extends baseFilter {
  type: 'range'
  minValue: number,
  maxValue: number
}
export type filter = rangeFilter|selectFilter
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseServiceUrl = baseUrl + 'category'
  constructor(
    private httpModule: HttpClient
  ) { }
  GETgetAllCategories() {
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl)) as Promise<{ categoryArray: categoryData[] }>
  }
}
