import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { imageSliderData } from '../image-slider/image-slider.component';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TemplateRef } from '@angular/core';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { category, CategoryService } from '../../services/category.service';

interface shopData {
  cost: number;
  url: string;
}
interface furnitureProportions{
  width:number|null;
  length:number|null;
  height:number|null;
}
export interface furnitureData {
  name: string;
  description: string;
  shops: shopData[];
  category?:string;
  proportions:furnitureProportions
}
interface colorClientData {
  color: string, imagesData: imageSliderData
}
export interface colorServerData {
  color: string,
  imagesData: {
    images: Blob[],
    idMainImage: number
  }
}
export interface additionalData{
  category:string
}
export interface furnitureClientData extends furnitureData {
  colors: colorClientData[]
}
export interface furnitureServerData extends furnitureData {
  colors: colorServerData[]
}
@Component({
  selector: 'app-create-furniture',
  standalone: true,
  imports: [ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule, NgTemplateOutlet, FormsModule],
  templateUrl: './create-furniture.component.html',
  styleUrls: ['./create-furniture.component.scss']
})
export class CreateFurnitureComponent implements OnInit,AfterViewInit{
  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private clientImageControl: ClientImageControlService,
    private categoryService:CategoryService
  ) { }

  @ViewChild('colorModule') private colorModuleTemplate!: TemplateRef<any>;
  @ViewChild('shopsModule') private shopsModuleTemplate!: TemplateRef<any>;
  @ViewChild('additionalModule') private additionalModuleTemplate!: TemplateRef<any>;
  lastClickedShop: number | undefined = undefined
  lastClickedColor: number | undefined = undefined
  addModuleTemplate!: TemplateRef<any>;
  furnitureModelInput!:HTMLInputElement
  addColorVisible: boolean = false;
  addModule!: HTMLDivElement;
  currentColorId: number | undefined = undefined
  @Input()
  colorsClientData: { color: string, imagesData: imageSliderData }[] = []
  @Input()
  furnitureData!: furnitureServerData
  categoriesArray:category[]=[]
  ngOnInit(): void {
    this.initCategories()
  }
  initCategories(){
    this.categoryService.GETgetAllCategories()
    .subscribe({
      next:(value)=>{
        console.log(value)
        this.categoriesArray=value.categoryArray
      },
      error:(error)=>{
        console.log(error)
      }
    })
  }
  ngAfterViewInit(): void {
    this.addModule = this.elementRef.nativeElement.querySelector('.addModule');
    this.furnitureModelInput=this.elementRef.nativeElement.querySelector('.furnitureModelInput')
  }

  async onInputImages(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const files = inputElement.files;
    if (!files || this.currentColorId === undefined) return;

    const compressedImages: Blob[] = [];
    for (let i = 0; i < files.length; i++) {
      const compressedImage = await this.clientImageControl.compressImage(files[i]);
      if (compressedImage) compressedImages.push(compressedImage);
    }
    this.furnitureData.colors[this.currentColorId].imagesData.images = compressedImages;
    this.colorsClientData[this.currentColorId].imagesData.images = compressedImages.map(blob => URL.createObjectURL(blob));
  }
  removeImages() {
    if (this.currentColorId === undefined || !this.furnitureData.colors[this.currentColorId].imagesData.images) return
    this.furnitureData.colors[this.currentColorId].imagesData.images.length = 0
    this.colorsClientData[this.currentColorId].imagesData.images.length=0
  }
  colorForm = new FormGroup({
    color: new FormControl('', [Validators.required])
  });
  shopForm = new FormGroup({
    cost: new FormControl<number | null>(null, [Validators.required, this.numberValidator]),
    url: new FormControl('', [Validators.required])
  });
  numberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value !== null && isNaN(value)) {
      return { notANumber: true };
    }
    return null;
  }
  addColor() {
    const pushColor = this.colorForm.value.color
    if (!pushColor) return
    const colorItem = {
      color: pushColor,
      imagesData: {
        images: [],
        idMainImage: 0
      }
    }
    this.furnitureData.colors.push(colorItem);
    this.colorsClientData.push(colorItem)
    this.colorForm.patchValue({
      color: ''
    })
    this.currentColorId = this.furnitureData.colors.length - 1

    setTimeout(() => {
      this.closeAddModule()
      this.openFurnitureVariant(this.currentColorId!)
    }, 0)
  }
  closeAddModule() {
    this.addModule.classList.add('disabled');
  }
  openColorModule(event: Event) {
    event.preventDefault()
    this.addModuleTemplate = this.colorModuleTemplate;
    this.addModule.classList.remove('disabled');
    setTimeout(() => {
      const INPUT_COLOR_ELEMENT = this.elementRef.nativeElement.querySelector('.addModuleInput') as HTMLInputElement
      INPUT_COLOR_ELEMENT.focus()
    }, 0)

  }
  addShop() {
    if (this.lastClickedShop) {
      this.furnitureData.shops[this.lastClickedShop] = {
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
  deleteColor() {
    const DELETE_COLOR_ID = this.currentColorId
    this.currentColorId=0
    this.colorsClientData=this.colorsClientData.filter((colorData,index)=>index!==DELETE_COLOR_ID)
    this.furnitureData.colors= this.furnitureData.colors.filter((colorData,index)=>index!==DELETE_COLOR_ID)
  }
  openShopsModule(idShop?: number) {
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
  openAdditional(){
    this.addModuleTemplate = this.additionalModuleTemplate;
    this.addModule.classList.remove('disabled');
  }
  openFurnitureVariant(idColor: number) {
    const colorsElement = this.elementRef.nativeElement.querySelector('.colors') as HTMLSpanElement;
    const colorButtonElement = colorsElement.querySelector(`[data-idColor="${idColor}"]`) as HTMLButtonElement
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
  changeIdMainImage(idMainImage: number) {
    if (this.currentColorId === undefined || this.furnitureData.colors[this.currentColorId].imagesData.idMainImage === undefined) return
    this.furnitureData.colors[this.currentColorId].imagesData.idMainImage = idMainImage
  }
}
