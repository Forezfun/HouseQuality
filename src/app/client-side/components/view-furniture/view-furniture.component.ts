import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';
import { imageSliderData } from '../image-slider/image-slider/image-slider.component';
import { ImageSliderComponent } from '../image-slider/image-slider/image-slider.component';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { ErrorHandlerComponent } from '../error-handler/error-handler/error-handler.component';
interface shopData {
  cost: number;
  url: string;
}

export interface furnitureData {
  name: string;
  colors: string[];
  imagesData: imageSliderData;
  description: string;
  shops: shopData[];
}
@Component({
  selector: 'app-view-furniture',
  standalone: true,
  imports: [ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './view-furniture.component.html',
  styleUrl: './view-furniture.component.scss'
})
export class ViewFurnitureComponent implements AfterViewInit{  
    @Input()
    furnitureData!: furnitureData;
    constructor(
      private elementRef: ElementRef,
      private clipboardService: ClipboardService
    ) { }
  
  ngAfterViewInit(): void {
    const colorSliderElement = this.elementRef.nativeElement.querySelector('.colorSlider') as HTMLSpanElement
    console.log(this.furnitureData.colors.length)
    colorSliderElement.style.setProperty('--total-items',this.furnitureData.colors.length.toString())
  }
    openFurnitureVariant(colorButton: EventTarget) {
      const colorButtonElement = colorButton as HTMLButtonElement;
      const colorsElement = this.elementRef.nativeElement.querySelector('.colors') as HTMLSpanElement;
      const idColor = colorButtonElement.getAttribute('data-idcolor');
      if (!idColor) return;
  
      const colorVariants = colorsElement.querySelectorAll('.colorVariant')
      let beforeColors: HTMLButtonElement[] = [], afterColors: HTMLButtonElement[] = []
      colorVariants.forEach((colorVariant, indexVariant) => {
        if (indexVariant > +idColor) {
          afterColors = [...afterColors, colorVariant as HTMLButtonElement]
        } else if (indexVariant < +idColor) {
          beforeColors = [...beforeColors, colorVariant as HTMLButtonElement]
        }
      });
      [colorButtonElement, ...afterColors, ...beforeColors].forEach((colorVariant, newIndex) => {
        (colorVariant as HTMLButtonElement).style.setProperty('--index', (newIndex + 1).toString())
      })
      setTimeout(() => {
        colorButtonElement.style.setProperty('margin-right', '115px')
      }, 500)
      setTimeout(() => {
        colorButtonElement.style.setProperty('margin-right', '0')
      }, 1250)
    }
  copyShopLink(furnitureUrl:string){
    this.clipboardService.copyFromContent(furnitureUrl)
  }
}
