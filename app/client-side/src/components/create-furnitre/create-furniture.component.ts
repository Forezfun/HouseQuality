import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ImageSliderComponent } from '../image-slider/image-slider.component';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TemplateRef } from '@angular/core';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { categoryData, CategoryService, filter, option } from '../../services/category.service';
import { AutoHeightDirective } from '../../directives/auto-height.directive';
import { furnitureFromServerData } from '../../services/furniture-card-control.service';
import { NotificationService } from '../../services/notification.service';
import { CostFormatPipe } from '../../pipes/cost-format.pipe';

@Component({
  selector: 'app-create-furniture',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, AutoHeightDirective, ImageSliderComponent, NgFor, NgIf, ReactiveFormsModule, NgTemplateOutlet, FormsModule, CostFormatPipe],
  templateUrl: './create-furniture.component.html',
  styleUrls: ['./create-furniture.component.scss']
})
export class CreateFurnitureComponent implements OnInit, AfterViewInit {
  /**
   * Конструктор компонента CreateFurnitureComponent
   * @param elementRef - ссылка на DOM-элемент компонента
   * @param changeDetectorRef - сервис для ручного обнаружения изменений
   * @param clientImageControl - сервис для работы с изображениями клиента
   * @param categoryService - сервис для работы с категориями мебели
   * @param notification - сервис для отображения уведомлений
   */
  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private clientImageControl: ClientImageControlService,
    private categoryService: CategoryService,
    private notification: NotificationService
  ) { }

  /** Контейнер дополнительного модуля */
  private addModule!: HTMLDivElement;

  /** Флаг мобильного просмотра */
  protected isMobileView = false;

  /** Индекс последнего выбранного магазина */
  protected lastClickedShop: number | undefined = undefined;

  /** Индекс последнего выбранного цвета */
  protected lastClickedColor: number | undefined = undefined;

  /** Шаблон дополнительного модуля */
  protected addModuleTemplate!: TemplateRef<any>;

  /** Флаг видимости добавления цвета */
  protected addColorVisible: boolean = false;

  /** Массив категорий */
  protected categoryArray: categoryData[] = [];

  /** Текущий выбранный цвет (индекс) */
  public currentColorId: number | undefined = undefined;

  /** Поле ввода модели мебели */
  public furnitureModelInput!: HTMLInputElement;

  /** Входные данные мебели */
  @Input()
  furnitureData!: furnitureFromServerData;

  /** Шаблон для выбора цвета */
  @ViewChild('colorModule') private colorModuleTemplate!: TemplateRef<any>;

  /** Шаблон для магазинов */
  @ViewChild('shopsModule') private shopsModuleTemplate!: TemplateRef<any>;

  /** Шаблон для дополнительных параметров */
  @ViewChild('additionalModule') private additionalModuleTemplate!: TemplateRef<any>;

  /**
   * Инициализация компонента
   */
  ngOnInit() {
    this.initCategories();
    this.checkViewport();
  }

  /**
   * Инициализация после отображения представления
   */
  ngAfterViewInit(): void {
    this.addModule = this.elementRef.nativeElement.querySelector('.addModule');
    this.furnitureModelInput = this.elementRef.nativeElement.querySelector('.furnitureModelInput');
  }

  /**
   * Загрузка и инициализация списка категорий
   */
  private async initCategories() {
    try {
      this.categoryArray = (await this.categoryService.GETgetAllCategories()).categoryArray;
    } catch (error) {
      this.notification.setError('Ошибка загрузки категорий', 5000);
    }
  }

  /**
   * Обработчик события выбора изображений
   * @param event - событие выбора файлов
   */
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
      this.notification.setError('Ошибка загрузки изображений', 5000);
    }
  }

  /**
   * Обработчик изменения размера окна, определяет мобильный вид
   */
  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 600;
  }

  /**
   * Валидация, проверяющая, что значение является числом
   * @param control - форма управления
   * @returns объект ошибки или null
   */
  private numberValidator(control: AbstractControl): ValidationErrors | null {
    const VALUE = control.value;
    if (VALUE !== null && isNaN(VALUE)) {
      return { notANumber: true };
    }
    return null;
  }

  /**
   * Удаление изображений для текущего цвета
   */
  protected removeImages() {
    if (this.currentColorId === undefined || !this.furnitureData.colors[this.currentColorId].imagesData.images) return;
    this.furnitureData.colors[this.currentColorId].imagesData.images.length = 0;
  }

  /**
   * Сохранение дополнительных параметров (пропорций)
   */
  protected saveAdditional() {
    if (this.proportionsForm.invalid) {
      this.proportionsForm.markAllAsTouched();
      this.notification.setError('Заполните все параметры', 5000);
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

  /**
   * Открытие варианта мебели по цвету
   * @param idColor - индекс цвета
   */
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

  /**
   * Получить фильтры для выбранной категории
   * @returns массив фильтров
   */
  protected getfilterData(): filter[] {
    if (!this.furnitureData.additionalData.category) return []
    const INDEX = this.categoryArray.findIndex(categoryData => categoryData.name === this.furnitureData.additionalData.category)
    return this.categoryArray[INDEX].filters ?? []
  }

  /**
   * Добавление нового цвета в мебель
   */
  protected addColor() {
    const PUSH_COLOR = this.colorForm.value.color;
    if (!PUSH_COLOR) {
      this.notification.setError('Укажите цвет', 5000);
      return;
    }
    for (let colorItem of this.furnitureData.colors) {
      if (colorItem.color === PUSH_COLOR) {
        this.closeAddModule()
        this.notification.setError('Такой цвет уже есть', 5000)
        return
      }
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

  /**
   * Закрыть дополнительный модуль
   */
  protected closeAddModule() {
    this.addModule.classList.add('disabled');
  }

  /**
   * Добавить или обновить магазин с ценой и ссылкой
   */
  protected addShop() {
    if (this.lastClickedShop !== undefined) {
      this.furnitureData.shops[this.lastClickedShop] = {
        cost: this.shopForm.value.cost!,
        url: this.shopForm.value.url!
      };
    }
    this.furnitureData.shops.push({
      cost: this.shopForm.value.cost!,
      url: this.shopForm.value.url!
    });
    this.closeAddModule();
    this.shopForm.patchValue({
      cost: null,
      url: null
    })
  }

  /**
   * Удалить магазин по индексу
   */
  protected deleteShop() {
    if (this.lastClickedShop != null && this.lastClickedShop >= 0 && this.lastClickedShop < this.furnitureData.shops.length) {
      this.furnitureData.shops.splice(this.lastClickedShop, 1);
      this.changeDetectorRef.detectChanges();
      this.lastClickedShop = undefined;
      this.closeAddModule()
    }
  }

  /**
   * Открыть модуль добавления цвета
   * @param event - событие клика (опционально)
   */
  public openColorModule(event?: Event) {
    if (event) event.preventDefault();
    this.addModuleTemplate = this.colorModuleTemplate;
    this.addModule.classList.remove('disabled');
    setTimeout(() => {
      const INPUT_COLOR_ELEMENT = this.elementRef.nativeElement.querySelector('.addModuleInput') as HTMLInputElement;
      INPUT_COLOR_ELEMENT.focus();
    }, 10);
  }

  /**
   * Удалить текущий цвет
   */
  public deleteColor() {
    const DELETE_COLOR_ID = this.currentColorId;
    this.currentColorId = this.furnitureData.colors.length===1?undefined:0;
    this.furnitureData.colors = this.furnitureData.colors.filter((colorData, index) => index !== DELETE_COLOR_ID);
  }

  /**
   * Открыть модуль магазинов, если передан id, загружает данные магазина
   * @param idShop - индекс магазина (опционально)
   */
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

  /**
   * Открыть модуль дополнительных параметров и заполнить форму значениями
   */
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

  /** Форма для добавления цвета */
  protected colorForm = new FormGroup({
    color: new FormControl('', [Validators.required])
  });

  /** Форма для добавления/редактирования магазина */
  protected shopForm = new FormGroup({
    cost: new FormControl<number | null>(null, [Validators.required, this.numberValidator]),
    url: new FormControl('', [Validators.required])
  });

  /** Форма для дополнительных параметров (пропорций) */
  protected proportionsForm = new FormGroup({
    width: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    length: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    height: new FormControl<number | null>(null, [Validators.required, Validators.min(0)])
  });
}
