import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { imageSliderData } from '../image-slider/image-slider/image-slider.component';
import { ImageSliderComponent } from '../image-slider/image-slider/image-slider.component';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { ErrorHandlerComponent } from '../error-handler/error-handler.component';
import { furnitureClientData } from '../create-furnitre/create-furniture.component';
import { FurnitureCardControlService } from '../../services/furniture-card-control.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
interface shopData {
  cost: number;
  url: string;
}

@Component({
  selector: 'app-view-furniture',
  standalone: true,
  imports: [ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './view-furniture.component.html',
  styleUrl: './view-furniture.component.scss'
})
export class ViewFurnitureComponent implements AfterViewInit, OnChanges {
  @Input()
  furnitureId?: string
  @Input()
  furnitureData?: furnitureClientData;
  constructor(
    private elementRef: ElementRef,
    private clipboardService: ClipboardService,
    private furnitureCardService: FurnitureCardControlService,
    private imagesServerControl: ServerImageControlService
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.furnitureId === undefined) return
    this.furnitureCardService.GETfurnitureCard(this.furnitureId, '')
      .subscribe({
        next: (response) => {
          console.log(response)
          this.furnitureData = (response as any).furnitureCard;
          (response as any).furnitureCard.colors.forEach(async (colorData: any, index: number) => {
            if (!this.furnitureData) return
            console.log(this.furnitureData.colors[index])
            const IMAGES_DATA = await this.imagesServerControl.GETallProjectImages(this.furnitureId!, colorData.color) as any
            console.log(IMAGES_DATA)
            const IMAGES_PATHES = IMAGES_DATA.imagesURLS as string[]
            console.log(IMAGES_PATHES)
            console.log(this.furnitureData)

            this.furnitureData.colors[index].imagesData={
              idMainImage:IMAGES_DATA.idMainImage,
              images:IMAGES_PATHES.map(imageUrl => this.imagesServerControl.GETsimpleImage(imageUrl))
            }
          })
        },
        error: (error) => {
          console.log(error)
        }
      })
  }
  ngAfterViewInit(): void {
    const colorSliderElement = this.elementRef.nativeElement.querySelector('.colorSlider') as HTMLSpanElement
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
