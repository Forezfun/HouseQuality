import { Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { FurnitureCardControlService, furnitureFromServerData, furnitureProportions } from '../../services/furniture-card-control.service';
import { NotificationService } from '../../services/notification.service';
import { CostFormatPipe } from '../../pipes/cost-format.pipe';

@Component({
  selector: 'app-view-furniture',
  standalone: true,
  imports: [ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule,CostFormatPipe],
  templateUrl: './view-furniture.component.html',
  styleUrl: './view-furniture.component.scss'
})
export class ViewFurnitureComponent implements OnChanges {
  constructor(
    private elementRef: ElementRef,
    private clipboardService: ClipboardService,
    private furnitureCardService: FurnitureCardControlService,
    private notification: NotificationService
  ) { }

  protected currentColorId: number = 0

  @Input()
  furnitureCardId?: string
  @Input()
  furnitureData?: furnitureFromServerData;

  async ngOnChanges(changes: SimpleChanges) {
    if (this.furnitureCardId === undefined) return
    try {
      this.furnitureData = (await this.furnitureCardService.GETfurnitureCard(this.furnitureCardId)).furnitureCard
    } catch (error) {
      console.log(error)
    }
  }

  protected openFurnitureVariant(colorButton: EventTarget) {
    const COLOR_BUTTON_ELEMENT = colorButton as HTMLButtonElement;
    const COLORS_ELEMENT = this.elementRef.nativeElement.querySelector('.colors') as HTMLSpanElement;
    const idColor = COLOR_BUTTON_ELEMENT.getAttribute('data-idcolor');
    if (!idColor) return;

    const COLORS_VARIANTS = COLORS_ELEMENT.querySelectorAll('.colorVariant')
    let beforeColors: HTMLButtonElement[] = [], afterColors: HTMLButtonElement[] = []
    COLORS_VARIANTS.forEach((colorVariant, indexVariant) => {
      if (indexVariant > +idColor) {
        afterColors = [...afterColors, colorVariant as HTMLButtonElement]
      } else if (indexVariant < +idColor) {
        beforeColors = [...beforeColors, colorVariant as HTMLButtonElement]
      }
    });
    [COLOR_BUTTON_ELEMENT, ...afterColors, ...beforeColors].forEach((colorVariant, newIndex) => {
      (colorVariant as HTMLButtonElement).style.setProperty('--index', (newIndex + 1).toString())
    })
    setTimeout(() => {
      COLOR_BUTTON_ELEMENT.style.setProperty('margin-right', '115px')
    }, 500)
    setTimeout(() => {
      this.currentColorId = +idColor
      COLOR_BUTTON_ELEMENT.style.setProperty('margin-right', '0')
    }, 1250)
  }
  protected proccessDescription(description: string, proportions: furnitureProportions) {
    return `Ширина: ${proportions.width} см\nДлина: ${proportions.length} см\nВысота: ${proportions.height} см\n${description}`;
  }
  protected copyShopLink(furnitureUrl: string) {
    this.clipboardService.copyFromContent(furnitureUrl)
  }
}
