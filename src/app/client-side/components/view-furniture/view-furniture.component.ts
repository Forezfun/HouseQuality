import { Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { FurnitureCardControlService, furnitureFromServerData } from '../../services/furniture-card-control.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-view-furniture',
  standalone: true,
  imports: [ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './view-furniture.component.html',
  styleUrl: './view-furniture.component.scss'
})
export class ViewFurnitureComponent implements OnChanges {
  @Input()
  furnitureId?: string
  @Input()
  furnitureData?: furnitureFromServerData;
  constructor(
    private elementRef: ElementRef,
    private clipboardService: ClipboardService,
    private furnitureCardService: FurnitureCardControlService,
    private imagesServerControl: ServerImageControlService,
    private errorHandler:ErrorHandlerService
  ) { }
  async ngOnChanges(changes: SimpleChanges) {
    if (this.furnitureId === undefined) return
    try {
      this.furnitureData = (await this.furnitureCardService.GETfurnitureCard(this.furnitureId)).furnitureCard
    } catch (error) {
      console.log(error)
    }
  }
  currentColorId: number = 0
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
      this.currentColorId = +idColor
      colorButtonElement.style.setProperty('margin-right', '0')
    }, 1250)
  }
  copyShopLink(furnitureUrl: string) {
    this.clipboardService.copyFromContent(furnitureUrl)
  }
}
