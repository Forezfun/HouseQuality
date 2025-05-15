import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TemplateRef } from '@angular/core';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { categoryData, CategoryService } from '../../services/category.service';
import { AutoHeightDirective } from '../../directives/auto-height.directive';
import { furnitureFromServerData } from '../../services/furniture-card-control.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

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
    private categoryService: CategoryService,
    private errorHandler: ErrorHandlerService
  ) { }

  private addModule!: HTMLDivElement;
  protected isMobileView = false;
  protected lastClickedShop: number | undefined = undefined;
  protected lastClickedColor: number | undefined = undefined;
  protected addModuleTemplate!: TemplateRef<any>;
  protected addColorVisible: boolean = false;
  protected categoriesArray: categoryData[] = [];
  public currentColorId: number | undefined = undefined;
  public furnitureModelInput!: HTMLInputElement;

  @Input()
  furnitureData!: furnitureFromServerData;
  @ViewChild('colorModule') private colorModuleTemplate!: TemplateRef<any>;
  @ViewChild('shopsModule') private shopsModuleTemplate!: TemplateRef<any>;
  @ViewChild('additionalModule') private additionalModuleTemplate!: TemplateRef<any>;
  @HostListener('window:resize', ['$event'])

  ngOnInit() {
    this.initCategories();
    this.checkViewport();
  }
  ngAfterViewInit(): void {
    this.addModule = this.elementRef.nativeElement.querySelector('.addModule');
    this.furnitureModelInput = this.elementRef.nativeElement.querySelector('.furnitureModelInput');
  }

  private async initCategories() {
    try {
      this.categoriesArray = (await this.categoryService.GETgetAllCategories()).categoryArray;
    } catch (error) {
      this.errorHandler.setError('Ошибка загрузки категорий', 5000);
    }
  }
  protected async onInputImages(event: Event) {
    const INPUT_ELEMENT = event.target as HTMLInputElement;
    const FILES = INPUT_ELEMENT.files;
    if (!FILES || this.currentColorId === undefined) return;

    try {
      let compressedImages: string[] = [];
      for (let i = 0; i < FILES.length; i++) {
        const COMPRESSED_IMAGE = await this.clientImageControl.compressImage(FILES[i]);
        if (COMPRESSED_IMAGE) compressedImages.push(URL.createObjectURL(COMPRESSED_IMAGE));
      }
      this.furnitureData.colors[this.currentColorId].imagesData.images = compressedImages;
    } catch (error) {
      this.errorHandler.setError('Ошибка загрузки изображений', 5000);
    }
  }

  private checkViewport() {
    this.isMobileView = window.innerWidth <= 600;
  }
  private numberValidator(control: AbstractControl): ValidationErrors | null {
    const VALUE = control.value;
    if (VALUE !== null && isNaN(VALUE)) {
      return { notANumber: true };
    }
    return null;
  }
  protected removeImages() {
    if (this.currentColorId === undefined || !this.furnitureData.colors[this.currentColorId].imagesData.images) return;
    this.furnitureData.colors[this.currentColorId].imagesData.images.length = 0;
  }
  protected saveAdditional() {
    if (this.proportionsForm.invalid) {
      this.proportionsForm.markAllAsTouched();
      this.errorHandler.setError('Заполните все параметры', 5000);
      return;
    }
    const { width, length, height } = this.proportionsForm.value;
    if (width && length && height) {
      this.furnitureData.proportions = {
        width, length, height
      };
    }
    this.closeAddModule();
  }
  protected openFurnitureVariant(idColor: number) {
    const COLORS_ELEMENT = this.elementRef.nativeElement.querySelector('.colors') as HTMLSpanElement;
    const COLOR_BUTTON_ELEMENT = COLORS_ELEMENT.querySelector(`[data-idColor="${idColor}"]`) as HTMLButtonElement;
    const COLORS_VARIANTS = COLORS_ELEMENT.querySelectorAll('.colorVariant');
    let beforeColors: HTMLButtonElement[] = [], afterColors: HTMLButtonElement[] = [];

    COLORS_VARIANTS.forEach((colorVariant, indexVariant) => {
      if (indexVariant > +idColor) {
        afterColors = [...afterColors, colorVariant as HTMLButtonElement];
      } else if (indexVariant < +idColor) {
        beforeColors = [...beforeColors, colorVariant as HTMLButtonElement];
      }
    });

    [COLOR_BUTTON_ELEMENT, ...afterColors, ...beforeColors].forEach((colorVariant, newIndex) => {
      (colorVariant as HTMLButtonElement).style.setProperty('--index', (newIndex + 1).toString());
    });

    setTimeout(() => {
      COLOR_BUTTON_ELEMENT.style.setProperty('margin-right', '115px');
    }, 500);

    setTimeout(() => {
      this.currentColorId = +idColor;
      COLOR_BUTTON_ELEMENT.style.setProperty('margin-right', '0');
    }, 1250);
  }
  protected addColor() {
    const PUSH_COLOR = this.colorForm.value.color;
    if (!PUSH_COLOR) {
      this.errorHandler.setError('Укажите цвет', 5000);
      return;
    }
    const colorItem = {
      color: PUSH_COLOR,
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
  protected closeAddModule() {
    this.addModule.classList.add('disabled');
  }
  protected addShop() {
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
  protected deleteShop() {
    if (this.lastClickedShop != null && this.lastClickedShop >= 0 && this.lastClickedShop < this.furnitureData.shops.length) {
      this.furnitureData.shops.splice(this.lastClickedShop, 1);
      this.changeDetectorRef.detectChanges();
      this.lastClickedShop = undefined;
    }
  }

  public openColorModule(event?: Event) {
    if (event) event.preventDefault();
    this.addModuleTemplate = this.colorModuleTemplate;
    this.addModule.classList.remove('disabled');
    setTimeout(() => {
      const INPUT_COLOR_ELEMENT = this.elementRef.nativeElement.querySelector('.addModuleInput') as HTMLInputElement;
      INPUT_COLOR_ELEMENT.focus();
    }, 10);
  }
  public deleteColor() {
    const DELETE_COLOR_ID = this.currentColorId;
    this.currentColorId = 0;
    this.furnitureData.colors = this.furnitureData.colors.filter((colorData, index) => index !== DELETE_COLOR_ID);
  }
  public openShopsModule(idShop?: number) {
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
  public openAdditional() {
    this.proportionsForm.patchValue({
      width: this.furnitureData.proportions.width,
      length: this.furnitureData.proportions.length,
      height: this.furnitureData.proportions.height
    });
    if (this.furnitureData.proportions.width === null) {
      this.proportionsForm.get('width')?.markAsTouched();
    }
    if (this.furnitureData.proportions.length === null) {
      this.proportionsForm.get('length')?.markAsTouched();
    }
    if (this.furnitureData.proportions.height === null) {
      this.proportionsForm.get('height')?.markAsTouched();
    }

    this.addModuleTemplate = this.additionalModuleTemplate;
    this.addModule.classList.remove('disabled');
  }

  protected colorForm = new FormGroup({
    color: new FormControl('', [Validators.required])
  });
  protected shopForm = new FormGroup({
    cost: new FormControl<number | null>(null, [Validators.required, this.numberValidator]),
    url: new FormControl('', [Validators.required])
  });
  protected proportionsForm = new FormGroup({
    width: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    length: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    height: new FormControl<number | null>(null, [Validators.required, Validators.min(0)])
  });
}