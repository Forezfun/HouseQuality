import { Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { furnitureClientData } from '../create-furnitre/create-furniture.component';
import { FurnitureCardControlService } from '../../services/furniture-card-control.service';
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
  furnitureData?: furnitureClientData;
  constructor(
    private elementRef: ElementRef,
    private clipboardService: ClipboardService,
    private furnitureCardService: FurnitureCardControlService,
    private imagesServerControl: ServerImageControlService,
    private errorHandler:ErrorHandlerService
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.furnitureId === undefined) return
    this.furnitureCardService.GETfurnitureCard(this.furnitureId, '')
      .subscribe({
        next: (response) => {
          this.furnitureData = (response as any).furnitureCard;
          (response as any).furnitureCard.colors.forEach(async (colorData: any, index: number) => {
            if (!this.furnitureData) return
            const IMAGES_DATA = await this.imagesServerControl.GETallProjectImages(this.furnitureId!, colorData.color) as any
            const IMAGES_PATHES = IMAGES_DATA.imagesURLS as string[]

            this.furnitureData.colors[index].imagesData={
              idMainImage:IMAGES_DATA.idMainImage,
              images:IMAGES_PATHES.map(imageUrl => this.imagesServerControl.GETsimpleImage(imageUrl))
            }
          })

        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while receiving furniture', 5000)
        }
      })
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
