import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { Observable } from 'rxjs';
export interface category{
  name:string;
  translateOne:string;
  translateMany:string;
}
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private httpModule: HttpClient
  ) { }
  GETgetAllCategories(){
        return this.httpModule.get(baseUrl + 'category/all') as Observable<{categoryArray:category[]}>
  }
}
