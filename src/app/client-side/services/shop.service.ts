import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
export interface furnitureShopData{
  name:string;
  cost:string;
  previewUrl:string;
  furnitureId:string;
}
@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private baseServiceUrl= baseUrl+'shop/'
  constructor(
    private httpModule: HttpClient
  ) {}
  async GETgetCategoryData(categoryName:string,startRange:number){
    try {
      let {resultsArray} = await firstValueFrom(this.httpModule.get(`${this.baseServiceUrl}category?category=${categoryName}&startRange=${startRange}`)) as {resultsArray:furnitureShopData[]}
      resultsArray=resultsArray.map(furniture=>{
        return {
          ...furniture,
          previewUrl:baseUrl+furniture.previewUrl
        }
      })
      return {resultsArray:resultsArray}
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async GETgetAllFurnitures(startRange:number){
        try {
      let {resultsArray} = await firstValueFrom(this.httpModule.get(`${this.baseServiceUrl}all?startRange=${startRange}`)) as {resultsArray:furnitureShopData[]}
      resultsArray=resultsArray.map(furniture=>{
        return {
          ...furniture,
          previewUrl:baseUrl+furniture.previewUrl
        }
      })
      return {resultsArray:resultsArray}
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
