import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider/image-slider.component';
import { imageSliderData } from '../image-slider/image-slider/image-slider.component';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TemplateRef } from '@angular/core';

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
  selector: 'app-create-furniture',
  standalone: true,
  imports: [ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './create-furniture.component.html',
  styleUrls: ['./create-furniture.component.scss']
})
export class CreateFurnitureComponent implements AfterViewInit {
  @ViewChild('colorModule') private colorModuleTemplate!: TemplateRef<any>;
  @ViewChild('shopsModule') private shopsModuleTemplate!: TemplateRef<any>;
  lastClickedShop: number | undefined = undefined
  lastClickedColor: number | undefined = undefined
  addModuleTemplate!: TemplateRef<any>;
  addColorVisible: boolean = false;
  addModule!: HTMLDivElement;

  @Input()
  furnitureData!: furnitureData;

  colorForm = new FormGroup({
    color: new FormControl('', [Validators.required])
  });
  shopForm = new FormGroup({
    cost: new FormControl<number | null>(null, [Validators.required]),
    url: new FormControl('', [Validators.required])
  });
  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef:ChangeDetectorRef
  ) { }

  addColor() {
    const pushColor = this.colorForm.value.color
    if (!pushColor) return
    this.furnitureData.colors.push(pushColor);
    this.colorForm.patchValue({
      color: ''
    })
    const colorSlider = this.elementRef.nativeElement.querySelector('.colorSlider') as HTMLSpanElement;
    const totalItems = +getComputedStyle(colorSlider).getPropertyValue('--total-items')
    console.log();
    colorSlider.style.setProperty('--total-items', (totalItems + 1).toString());
  }

  ngAfterViewInit(): void {
    this.addModule = this.elementRef.nativeElement.querySelector('.addModule');
  }

  closeAddModule() {
    this.addModule.classList.add('disabled');
  }

  openColorModule() {
    console.log('openColorModule');
    this.addModuleTemplate = this.colorModuleTemplate;
    this.addModule.classList.remove('disabled');
  }
  addShop() {
    if (this.lastClickedShop) {
      this.furnitureData.shops[this.lastClickedShop]={
        cost: this.shopForm.value.cost!,
        url: this.shopForm.value.url!
      }
    return
    }
    this.furnitureData.shops.push({
      cost: this.shopForm.value.cost!,
      url: this.shopForm.value.url!
    })
    this.closeAddModule()
  }
  deleteShop() {
    if (this.lastClickedShop != null && this.lastClickedShop >= 0 && this.lastClickedShop < this.furnitureData.shops.length) {
      this.furnitureData.shops.splice(this.lastClickedShop, 1);
      this.changeDetectorRef.detectChanges();
      this.lastClickedShop = undefined;
    }
  }
  
  openShopsModule(idShop?: number) {
    console.log('openShopsModule');
    console.log(idShop)
    if (idShop !== undefined) {
      this.lastClickedShop = idShop
      this.shopForm.patchValue({
        cost: this.furnitureData.shops[idShop].cost,
        url: this.furnitureData.shops[idShop].url
      })
    } else {
      this.lastClickedShop = undefined
      this.shopForm.patchValue({
        cost: null,
        url: ''
      })
    }
    this.addModuleTemplate = this.shopsModuleTemplate;
    this.addModule.classList.remove('disabled');
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
}
