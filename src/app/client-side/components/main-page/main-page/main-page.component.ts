import { Component } from '@angular/core';
import { CreateFurnitureComponent } from '../../create-furnitre/create-furniture.component';
import { ViewFurnitureComponent } from '../../view-furniture/view-furniture.component';
import { PlanHouseComponent } from '../../plan-house/plan-house/plan-house.component';

import { NgClass } from '@angular/common';
import { roomData } from '../../plan-house/plan-house/plan-house.component';
import { furnitureData } from '../../view-furniture/view-furniture.component';
import { NavigationPanelComponent } from '../../navigation-panel/navigation-panel.component';
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CreateFurnitureComponent,ViewFurnitureComponent,PlanHouseComponent,NgClass,NavigationPanelComponent],
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
  furnitureExamplesData:furnitureData={
    name:'Onte Bucle White',
    imagesData:{
      images: ['/assets/images/sofaSliderPhotos/1.png', '/assets/images/sofaSliderPhotos/2.png', '/assets/images/sofaSliderPhotos/3.png', '/assets/images/sofaSliderPhotos/4.png'],
      idMainImage: 0
    },
    colors:['#FFC2CC', '#344E41', '#808080', '#045B7A'],
    description:'Width: 170 cm  Length: 240 cm  Height: 83 cmRecommended-place: corner of the roomTransformation mechanism: pantographSupport material: spliced ​​solidClearance from floor: 12 cmExistence of a drawer for linen: yesArmrest color: main fabric colorRemovable cover: noDecorative pillows: without pillowsMaximum load per seat: 100 kg',
    shops:[{cost:125990,url:'https://www.divan.ru/blagoveshchensk/product/divan-uglovoj-onte-bucle-white'},{cost:84990,url:'https://avtorm.ru/catalog/product-divan-uglovoy-onte-bucle-white'}]
  }
  planHouseExampleData:roomData[]=[
    {
      name:'Гостинная',
      gridArea: '1 / 1 / 3 / 4',
      roomProportions:{
        width:3,
        length:2,
        height:3
      }
    },
    {
      name:'Спальня',
      gridArea: '3 / 1 / 4 / 2',
      roomProportions:{
        width:1,
        length:1,
        height:3
      }
    },
    {
      name:'Спальня',
      gridArea: ' 4 / 1 / 5 / 2',
      roomProportions:{
        width:1,
        length:1,
        height:3
      }
    },
    {
      name:'Прихожая',
      gridArea: '5 / 1 / 8 / 5',
      roomProportions:{
        width:4,
        length:3,
        height:3
      }
    },
    {
      name:'Санузел',
      gridArea: ' 3 / 2 / 5 / 4',
      roomProportions:{
        width:2,
        length:2,
        height:3
      }
    }
  ]

}
