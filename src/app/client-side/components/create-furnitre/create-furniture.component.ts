import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TemplateRef } from '@angular/core';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { categoryData, CategoryService } from '../../services/category.service';
import { throttle } from 'lodash';
import { AutoHeightDirective } from '../../directives/auto-height.directive';
import { colorClientData, colorFromServerData, furnitureClientData, furnitureFromServerData } from '../../services/furniture-card-control.service';


@Component({
  selector: 'app-create-furniture',
  standalone: true,
  imports: [NgClass, AutoHeightDirective, ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule, NgTemplateOutlet, FormsModule],
  templateUrl: './create-furniture.component.html',
  styleUrls: ['./create-furniture.component.scss']
})
export class CreateFurnitureComponent implements OnInit, AfterViewInit {
  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private clientImageControl: ClientImageControlService,
    private categoryService: CategoryService
  ) { }

  isMobileView = false;
  @Input() mode: 'create' | 'update' = 'create';

  @ViewChild('colorModule') private colorModuleTemplate!: TemplateRef<any>;
  @ViewChild('shopsModule') private shopsModuleTemplate!: TemplateRef<any>;
  @ViewChild('additionalModule') private additionalModuleTemplate!: TemplateRef<any>;

  lastClickedShop: number | undefined = undefined;
  lastClickedColor: number | undefined = undefined;
  addModuleTemplate!: TemplateRef<any>;
  furnitureModelInput!: HTMLInputElement;
  addColorVisible: boolean = false;
  addModule!: HTMLDivElement;
  currentColorId: number | undefined = undefined;

  @Input()
  furnitureData!: furnitureFromServerData;

  categoriesArray: categoryData[] = [];

  colorForm = new FormGroup({
    color: new FormControl('', [Validators.required])
  });

  shopForm = new FormGroup({
    cost: new FormControl<number | null>(null, [Validators.required, this.numberValidator]),
    url: new FormControl('', [Validators.required])
  });

  proportionsForm = new FormGroup({
    width: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    length: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    height: new FormControl<number | null>(null, [Validators.required, Validators.min(0)])
  });

  ngOnInit(): void {
    this.initCategories();
    this.checkViewport();
  }

  @HostListener('window:resize', ['$event'])
  checkViewport() {
    this.isMobileView = window.innerWidth <= 600;
  }

  private async initCategories() {
    try {
      this.categoriesArray = (await this.categoryService.GETgetAllCategories()).categoryArray
    } catch (error) {
      console.log(error)
    }
  }

  ngAfterViewInit(): void {
    console.log(this.furnitureData)
    this.addModule = this.elementRef.nativeElement.querySelector('.addModule');
    this.furnitureModelInput = this.elementRef.nativeElement.querySelector('.furnitureModelInput');
  }

  async onInputImages(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const files = inputElement.files;
    if (!files || this.currentColorId === undefined) return;

    const compressedImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const compressedImage = await this.clientImageControl.compressImage(files[i]);
      if (compressedImage) compressedImages.push(URL.createObjectURL(compressedImage));
    }
    this.furnitureData.colors[this.currentColorId].imagesData.images = compressedImages;
  }

  removeImages() {
    if (this.currentColorId === undefined || !this.furnitureData.colors[this.currentColorId].imagesData.images) return;
    this.furnitureData.colors[this.currentColorId].imagesData.images.length = 0;
  }

  numberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value !== null && isNaN(value)) {
      return { notANumber: true };
    }
    return null;
  }

  addColor() {
    const pushColor = this.colorForm.value.color;
    if (!pushColor) return;
    const colorItem = {
      color: pushColor,
      imagesData: {
        images: [],
        idMainImage: 0
      }
    };
    this.furnitureData.colors.push(colorItem);
    this.colorForm.patchValue({
      color: ''
    });
    this.currentColorId = this.furnitureData.colors.length - 1;

    setTimeout(() => {
      this.closeAddModule();
      this.openFurnitureVariant(this.currentColorId!);
    }, 0);
  }

  closeAddModule() {
    this.addModule.classList.add('disabled');
  }

  openColorModule(event: Event) {
    event.preventDefault();
    this.addModuleTemplate = this.colorModuleTemplate;
    this.addModule.classList.remove('disabled');
    setTimeout(() => {
      const INPUT_COLOR_ELEMENT = this.elementRef.nativeElement.querySelector('.addModuleInput') as HTMLInputElement;
      INPUT_COLOR_ELEMENT.focus();
    }, 0);
  }

  addShop() {
    if (this.lastClickedShop !== undefined) {
      this.furnitureData.shops[this.lastClickedShop] = {
        cost: this.shopForm.value.cost!,
        url: this.shopForm.value.url!
      };
      return;
    }
    this.furnitureData.shops.push({
      cost: this.shopForm.value.cost!,
      url: this.shopForm.value.url!
    });
    this.closeAddModule();
  }

  deleteShop() {
    if (this.lastClickedShop != null && this.lastClickedShop >= 0 && this.lastClickedShop < this.furnitureData.shops.length) {
      this.furnitureData.shops.splice(this.lastClickedShop, 1);
      this.changeDetectorRef.detectChanges();
      this.lastClickedShop = undefined;
    }
  }

  autoHeightInput(event: Event) {
    const input = event.target as HTMLInputElement;
    throttle(() => {
      input.style.height = 'auto';
      input.style.height = (input.scrollHeight) + 'px';
    }, 250)();
  }

  deleteColor() {
    const DELETE_COLOR_ID = this.currentColorId;
    this.currentColorId = 0;
    this.furnitureData.colors = this.furnitureData.colors.filter((colorData, index) => index !== DELETE_COLOR_ID);
  }

  openShopsModule(idShop?: number) {
    if (idShop !== undefined) {
      this.lastClickedShop = idShop;
      this.shopForm.patchValue({
        cost: this.furnitureData.shops[idShop].cost,
        url: this.furnitureData.shops[idShop].url
      });
    } else {
      this.lastClickedShop = undefined;
      this.shopForm.patchValue({
        cost: null,
        url: ''
      });
    }
    this.addModuleTemplate = this.shopsModuleTemplate;
    this.addModule.classList.remove('disabled');
  }

  openAdditional() {
    this.proportionsForm.patchValue({
      width: this.furnitureData.proportions.width,
      length: this.furnitureData.proportions.length,
      height: this.furnitureData.proportions.height
    });
    if (this.mode === 'create') {
      if (this.furnitureData.proportions.width === null) {
        this.proportionsForm.get('width')?.markAsTouched();
      }
      if (this.furnitureData.proportions.length === null) {
        this.proportionsForm.get('length')?.markAsTouched();
      }
      if (this.furnitureData.proportions.height === null) {
        this.proportionsForm.get('height')?.markAsTouched();
      }
    }

    this.addModuleTemplate = this.additionalModuleTemplate;
    this.addModule.classList.remove('disabled');
  }

  saveAdditional() {
    if (this.mode === 'create' && this.proportionsForm.invalid) {
      // В create режиме проверяем валидность
      this.proportionsForm.markAllAsTouched();
      return;
    }
    const { width, length, height } = this.proportionsForm.value
    if (width && length && height) {
      this.furnitureData.proportions = {
        width, length, height
      }
    }

    this.closeAddModule();
  }

  openFurnitureVariant(idColor: number) {
    const colorsElement = this.elementRef.nativeElement.querySelector('.colors') as HTMLSpanElement;
    const colorButtonElement = colorsElement.querySelector(`[data-idColor="${idColor}"]`) as HTMLButtonElement;
    const colorVariants = colorsElement.querySelectorAll('.colorVariant');
    let beforeColors: HTMLButtonElement[] = [], afterColors: HTMLButtonElement[] = [];

    colorVariants.forEach((colorVariant, indexVariant) => {
      if (indexVariant > +idColor) {
        afterColors = [...afterColors, colorVariant as HTMLButtonElement];
      } else if (indexVariant < +idColor) {
        beforeColors = [...beforeColors, colorVariant as HTMLButtonElement];
      }
    });

    [colorButtonElement, ...afterColors, ...beforeColors].forEach((colorVariant, newIndex) => {
      (colorVariant as HTMLButtonElement).style.setProperty('--index', (newIndex + 1).toString());
    });

    setTimeout(() => {
      colorButtonElement.style.setProperty('margin-right', '115px');
    }, 500);

    setTimeout(() => {
      this.currentColorId = +idColor;
      colorButtonElement.style.setProperty('margin-right', '0');
    }, 1250);
  }

  changeIdMainImage(idMainImage: number) {
    if (this.currentColorId === undefined || this.furnitureData.colors[this.currentColorId].imagesData.idMainImage === undefined) return;
    this.furnitureData.colors[this.currentColorId].imagesData.idMainImage = idMainImage;
  }
}