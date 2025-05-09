import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom, Observable } from 'rxjs';
export interface categoryData {
  name: string;
  translateOne: string;
  translateMany: string;
}
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseServiceUrl = baseUrl+'category/'
  constructor(
    private httpModule: HttpClient
  ) { }
  GETgetAllCategories() {
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + 'all')) as Promise<{ categoryArray: categoryData[] }>
  }
}
