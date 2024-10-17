import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private baseUrl='http://localhost:8010/proxy/shop/'
  constructor(
    private httpModule: HttpClient
  ) {}
  GETgetCategoryData(categoryName:string,startRange:number){
    return this.httpModule.get(`${this.baseUrl}category?category=${categoryName}&startRange=${startRange}`)
  }
  GETgetAllFurnitures(startRange:number){
    return this.httpModule.get(`${this.baseUrl}all?startRange=${startRange}`)
  }
  GETgetImageByPath(filePath:string){
    return `${this.baseUrl}image/simple?filePath=${filePath}`
  }
}
