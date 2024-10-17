import { Component } from '@angular/core';
import { CreateFurnitureComponent, furnitureClientData, furnitureServerData} from '../../create-furnitre/create-furniture.component';
import { ViewFurnitureComponent } from '../../view-furniture/view-furniture.component';
import { PlanHouseComponent } from '../../plan-house/plan-house/plan-house.component';
import { NgClass } from '@angular/common';
import { roomData } from '../../plan-house/plan-house/plan-house.component';
import { NavigationPanelComponent } from '../../navigation-panel/navigation-panel.component';
import { RouterLink } from '@angular/router';
import { imageSliderData } from '../../image-slider/image-slider/image-slider.component';
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CreateFurnitureComponent,ViewFurnitureComponent,PlanHouseComponent,NgClass,NavigationPanelComponent,RouterLink],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent {
  furnitureTemplate:'view'|'create'='create'
  openViewFurniture(){
    this.furnitureTemplate='view'
  }
  openCreateFurniture(){
    this.furnitureTemplate='create'
  }
  focusFinder(){
    const FINDER_ELEMENT = document.querySelector('app-navigation-panel') as HTMLSpanElement
    FINDER_ELEMENT.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  imagesData:imageSliderData ={
    images: ['/assets/images/sofaSliderPhotos/1.png', '/assets/images/sofaSliderPhotos/2.png', '/assets/images/sofaSliderPhotos/3.png', '/assets/images/sofaSliderPhotos/4.png'],
    idMainImage: 0
  }
  furnitureExamplesData:furnitureServerData={
    name:'Onte Bucle White',
    colors:[],
    description:'Width: 170 cm  Length: 240 cm  Height: 83 cmRecommended-place: corner of the roomTransformation mechanism: pantographSupport material: spliced ​​solidClearance from floor: 12 cmExistence of a drawer for linen: yesArmrest color: main fabric colorRemovable cover: noDecorative pillows: without pillowsMaximum load per seat: 100 kg',
    shops:[{cost:125990,url:'https://www.divan.ru/blagoveshchensk/product/divan-uglovoj-onte-bucle-white'},{cost:84990,url:'https://avtorm.ru/catalog/product-divan-uglovoy-onte-bucle-white'}],
    category:'sofa'
  }
  exampleClientColors=[{color:'#FFC2CC',imagesData:this.imagesData}]
  viewExampleData:furnitureClientData = {
    name:this.furnitureExamplesData.name,
    colors:[
      {color:'#FFC2CC',imagesData:this.imagesData}
    ],
    description:this.furnitureExamplesData.description,
    shops:this.furnitureExamplesData.shops,
    category:this.furnitureExamplesData.category
  }
  planHouseExampleData:roomData[]=[
    {
      name:'Прихожая',
      gridArea: '1 / 1 / 3 / 4',
      roomProportions:{
        width:3,
        length:2,
        height:3
      }
    },
    {
      name:'Санузел',
      gridArea: '3 / 1 / 4 / 2',
      roomProportions:{
        width:1,
        length:1,
        height:3
      }
    },
    {
      name:'Санузел',
      gridArea: ' 4 / 1 / 5 / 2',
      roomProportions:{
        width:1,
        length:1,
        height:3
      }
    },
    {
      name:'Гостинная',
      gridArea: '5 / 1 / 8 / 5',
      roomProportions:{
        width:4,
        length:3,
        height:3
      }
    },
    {
      name:'Спальня',
      gridArea: ' 3 / 2 / 5 / 4',
      roomProportions:{
        width:2,
        length:2,
        height:3
      }
    }
  ]

}
