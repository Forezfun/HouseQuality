import { AfterViewInit, Component, ElementRef, ViewEncapsulation } from '@angular/core';
import { CreateFurnitureComponent, furnitureClientData, furnitureServerData } from '../create-furnitre/create-furniture.component';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { PlanHouseComponent } from '../plan-house/plan-house.component';
import { NgClass } from '@angular/common';
import { roomData } from '../plan-house/plan-house.component';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { Router, RouterLink } from '@angular/router';
import { imageSliderData } from '../image-slider/image-slider.component';
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CreateFurnitureComponent, ViewFurnitureComponent, PlanHouseComponent, NgClass, NavigationPanelComponent, RouterLink],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements AfterViewInit{
  constructor(
    private elementRef: ElementRef,
    private router:Router
  ) { }
  ngAfterViewInit(): void {
    (this.elementRef.nativeElement.querySelectorAll('app-create-furniture,app-plan-house') as NodeListOf<HTMLElement>).forEach(elem => {
      elem.querySelectorAll<HTMLElement>('*').forEach(child => {
        child.setAttribute('tabindex', "-1");
        child.style.pointerEvents = 'none';
      });
    });
  }
  imagesData: imageSliderData = {
    images: ['/assets/images/sofaSliderPhotos/1.png', '/assets/images/sofaSliderPhotos/2.png', '/assets/images/sofaSliderPhotos/3.png', '/assets/images/sofaSliderPhotos/4.png'],
    idMainImage: 0
  }
  furnitureTemplate: 'view' | 'create' = 'create'
  furnitureExamplesData: furnitureServerData = {
    name: 'Onte Bucle White',
    colors: [],
    description: 'Width: 170 cm  Length: 240 cm  Height: 83 cmRecommended-place: corner of the roomTransformation mechanism: pantographSupport material: spliced ​​solidClearance from floor: 12 cmExistence of a drawer for linen: yesArmrest color: main fabric colorRemovable cover: noDecorative pillows: without pillowsMaximum load per seat: 100 kg',
    shops: [{ cost: 125990, url: 'https://www.divan.ru/blagoveshchensk/product/divan-uglovoj-onte-bucle-white' }, { cost: 84990, url: 'https://avtorm.ru/catalog/product-divan-uglovoy-onte-bucle-white' }],
    category: 'sofa',
    proportions: {
      width: 1,
      height: 1,
      length: 1
    }
  }
  exampleClientColors = [{ color: '#FFC2CC', imagesData: this.imagesData }]
  viewExampleData: furnitureClientData = {
    name: this.furnitureExamplesData.name,
    colors: [
      { color: '#FFC2CC', imagesData: this.imagesData }
    ],
    description: this.furnitureExamplesData.description,
    shops: this.furnitureExamplesData.shops,
    category: this.furnitureExamplesData.category,
    proportions: this.furnitureExamplesData.proportions
  }
  planHouseExampleData: roomData[] = [
    {
      name: 'Прихожая',
      objects: [],
      gridArea: '1 / 1 / 3 / 4',
      roomProportions: {
        width: 3,
        length: 2,
        height: 3
      }
    },
    {
      name: 'Санузел',
      objects: [],
      gridArea: '3 / 1 / 4 / 2',
      roomProportions: {
        width: 1,
        length: 1,
        height: 3
      }
    },
    {
      name: 'Санузел',
      objects: [],
      gridArea: ' 4 / 1 / 5 / 2',
      roomProportions: {
        width: 1,
        length: 1,
        height: 3
      }
    },
    {
      name: 'Гостинная',
      objects: [],
      gridArea: '5 / 1 / 8 / 5',
      roomProportions: {
        width: 4,
        length: 3,
        height: 3
      }
    },
    {
      name: 'Спальня',
      objects: [],
      gridArea: ' 3 / 2 / 5 / 4',
      roomProportions: {
        width: 2,
        length: 2,
        height: 3
      }
    }
  ]
  
  focusOnFinder() {
    const finder = this.elementRef.nativeElement.querySelector('.finderInput')
    if (!finder) return
    finder.focus()
  }
  openViewFurniture() {
    this.furnitureTemplate = 'view'
  }
  openCreateFurniture() {
    this.furnitureTemplate = 'create'
  }
  focusFinder() {
    const FINDER_ELEMENT = document.querySelector('app-navigation-panel') as HTMLSpanElement
    FINDER_ELEMENT.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  navigateToPage(link:string){
    this.router.navigateByUrl(link)
  }
}
