import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { clientFilters, furnitureShopData, queryData, ShopService } from '../../services/shop.service';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { AccountService } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { projectInformation } from '../../services/project.service';
import { NotificationService } from '../../services/notification.service';
import { categoryData, CategoryService } from '../../services/category.service';
import { checkDesktop } from '../../usable/reusable-functions.used';
import { CostFormatPipe } from '../../pipes/cost-format.pipe';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { FinderService } from '../../services/finder.service';
import { Subscription } from 'rxjs';
import { FinderComponent } from '../finder/finder.component';

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [FinderComponent, ReactiveFormsModule, NgTemplateOutlet, FormsModule, NavigationPanelComponent, NgFor, NgIf, ViewFurnitureComponent, RouterLink, NgClass, RouterLink, CostFormatPipe, TuiTextfieldControllerModule],
  providers: [],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent implements OnInit, OnDestroy {

  /** Подписка на изменения имени мебели из FinderService*/
  private furnitureNameSubscription!: Subscription;

  /** Текущее имя мебели для фильтрации */
  private funritureName: string = '';

  /** Объект с формой фильтров, формируется из category.filters */
  protected queryGroup: any = {};

  /** ID выбранной карточки мебели (если есть) */
  protected furnitureCardId: undefined | string;

  /** Имя категории из URL параметров */
protected categoryName: undefined | string;

/** Массив проектов аккаунта пользователя */
protected accountProjects: projectInformation[] | undefined;

/** Индекс текущей категории в categoryArray */
protected currentCategoryId: number | undefined;

/** Массив загруженных карточек мебели */
protected furnituresArray: furnitureShopData[] = [];

/** Флаг открытия модуля добавления мебели */
protected openAddModuleToggle: boolean = false;

/** Массив всех категорий */
protected categoryArray: categoryData[] = [];

/** Объект фильтров, получаемый от сервера */
protected clientFiltersObject!: clientFilters;

/** Массив выбранных пользователем цветов для фильтрации */
protected selectedColors: string[] = [];



  constructor(
    private route: ActivatedRoute,
    private shopService: ShopService,
    private router: Router,
    private accountService: AccountService,
    private accountCookieService: AccountCookieService,
    private notification: NotificationService,
    private categoryService: CategoryService,
    private location: Location,
    private elementRef: ElementRef,
    private finderService: FinderService
  ) { }

  /**
   * Инициализация компонента
   * - очистка фильтров
   * - обработка параметров маршрута
   * - подписка на изменения имени мебели
   * - загрузка проектов аккаунта (если есть JWT)
  */
  async ngOnInit() {
    this.clearClientFilters();
    this.processRouteParams();
    this.furnitureNameSubscription = this.finderService.furnitureName$.subscribe(name => {
      this.furnituresArray = [];
      this.funritureName = name;
      this.requestFurnitures(this.categoryName ?? 'all', 0, this.handleQueryData());
    });

    const JWT = this.accountCookieService.getJwt();
    if (!JWT) return;
    try {
      this.accountProjects = (await this.accountService.GETaccount(JWT)).accountData.projects;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Очистка ресурсов при уничтожении компонента
   */
  ngOnDestroy(): void {
    this.furnitureNameSubscription.unsubscribe();
  }

  /**
   * Загрузка категорий с сервера и инициализация queryGroup для фильтров
   */
  private async initCategories() {
    try {
      this.categoryArray = (await this.categoryService.GETgetAllCategories()).categoryArray;
      this.categoryArray.forEach((categoryData, index) => {
        console.log(categoryData.name,this.categoryName);
        if (this.categoryName === categoryData.name) {
          this.currentCategoryId = index;
          this.initQueryGroup();
        }
      });
      console.log(this.currentCategoryId, this.categoryArray);
      if(this.currentCategoryId===undefined&&this.categoryArray.length>0&&this.categoryName!=='all'){
        this.router.navigateByUrl('/shop')
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Запрос мебели для текущей категории и установка наблюдателя прокрутки
   */
  private async furnituresInit() {
    if (this.categoryName !== undefined) {
      await this.requestFurnitures(this.categoryName, 0);
    } else {
      await this.requestFurnitures('all', 0);
    }
    this.setScrollObserver();
  }

  /**
   * Запрос данных мебели с сервера с фильтрами и пагинацией
   * @param categoryName - имя категории
   * @param furnituresCount - количество уже загруженных элементов (для пагинации)
   * @param queryData - объект с фильтрами для запроса
   */
  protected async requestFurnitures(categoryName: string, furnituresCount: number, queryData?: queryData) {
    const RESPONSE = await this.shopService.GETgetCategoryData(categoryName, furnituresCount, queryData);
    this.furnituresArray = [...this.furnituresArray, ...RESPONSE.resultsArray];
    this.clientFiltersObject = RESPONSE.resultsClientFiltersData;
  }

  /**
   * Очистка фильтров клиента
   */
  private clearClientFilters() {
    this.clientFiltersObject = {
      colors: [],
      minCost: 0,
      maxCost: 0
    };
  }

  /**
   * Инициализация группы фильтров queryGroup на основе текущей категории
  */
  private initQueryGroup() {
    if (this.currentCategoryId === undefined) return;
    this.queryGroup = {};
    this.categoryArray[this.currentCategoryId].filters.forEach(filterData => {
      if (filterData && filterData.type === 'select') {
        this.queryGroup[filterData.field] = [];
      } else {
        this.queryGroup[filterData.field] = new FormGroup({
          min: new FormControl(null, [this.numberOrEmptyValidator]),
          max: new FormControl(null, [this.numberOrEmptyValidator])
        });
      }
    });
  }
  
  /**
   * Валидатор для проверки, что значение является числом или пустым
   * @param control - форма контроля
   * @returns ошибка валидации или null
   */
  private numberOrEmptyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return isNaN(value) || value < 0 ? { notNumber: true } : null;
  }

  /**
   * Обработка параметров маршрута для установки категории и ID мебели
   */
  private processRouteParams() {
    const PARAMS = this.route.snapshot.params;
    
    this.categoryName = PARAMS['category'];
    this.furnitureCardId = PARAMS['furnitureCardId'];

    this.initCategories();
  }

  /**
   * Установка наблюдателя за прокруткой для подгрузки мебели при достижении конца списка
   */
  private setScrollObserver() {
    const SCROLL_CONTAINER = this.elementRef.nativeElement.querySelector('.category') as HTMLSpanElement;
    const items = SCROLL_CONTAINER.querySelectorAll('.furnitureItem') as NodeListOf<HTMLDivElement>;
    let observedCount = 0;

    const observerOptions = {
      root: SCROLL_CONTAINER,
      rootMargin: '0px',
      threshold: 0.5
    };

    const OBSERVER_CALLBACK: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const ITEM = entry.target as HTMLDivElement;
          const ITEM_INDEX: number = Array.from(items).indexOf(ITEM);

          if ((ITEM_INDEX + 1) % 8 === 0 && !ITEM.dataset['observed']) {
            ITEM.dataset['observed'] = 'true';
            observedCount++;
            if (this.categoryName !== undefined) {
              await this.requestFurnitures(this.categoryName, this.furnituresArray.length, this.handleQueryData());
            } else {
              await this.requestFurnitures('all', this.furnituresArray.length, this.handleQueryData());
            }
          }
        }
      });
    };
    
    const OBSERVER: IntersectionObserver = new IntersectionObserver(OBSERVER_CALLBACK, observerOptions);
    items.forEach((item: HTMLElement) => OBSERVER.observe(item));
  }

  /**
   * Проверка ширины экрана для определения типа устройства (мобильный/десктоп)
   * @returns true если ширина <= 768px
   */
  protected checkViewport() {
    return window.innerWidth <= 768;
  }

  /**
   * Запрос мебели с учетом текущих фильтров
  */
  protected requestWithFilters() {
    this.furnituresArray.length = 0;
    this.requestFurnitures(this.categoryName ?? 'all', 0, this.handleQueryData());
  }

  /**
   * Формирование объекта с данными фильтрации для запроса
   * @returns объект с данными фильтрации
  */
  protected handleQueryData() {
    const QUERY_DATA: any = {};
    if (this.funritureName.length > 0) QUERY_DATA.name = this.funritureName;
    Object.keys(this.queryGroup).forEach(key => {
      if (this.queryGroup[key] instanceof FormGroup) {
        if (!this.queryGroup[key].valid) return;
        const { min, max } = this.queryGroup[key].value;
        if (+min > 0 || +max > 0) {
          QUERY_DATA[key] = {
            min: +min,
            max: +max
          };
        }
      } else {
        if (this.queryGroup[key].length > 0) {
          QUERY_DATA[key] = this.queryGroup[key];
        }
      }
    });

    return QUERY_DATA;
  }

  /**
   * Добавление выбранного цвета в фильтр
   * @param color - цвет для добавления
   */
  protected addSelectedColor(color: string) {
    this.selectedColors.push(color);
  }

  /**
   * Удаление выбранного цвета из фильтра
   * @param color - цвет для удаления
  */
  protected deleteSelectedColor(color: string) {
    const SELECTED_COLOR_INDEX = this.selectedColors.findIndex(value => value === color);
    this.selectedColors.splice(SELECTED_COLOR_INDEX, 1);
  }

  /**
   * Добавление выбранного значения опции фильтра типа "select"
   * @param value - значение опции
   * @param field - имя поля фильтра
   */
  protected addSelectedOption(value: string, field: string) {
    if (!this.queryGroup[field]) return;
    this.queryGroup[field].push(value);
  }

  /**
   * Удаление выбранного значения опции фильтра типа "select"
   * @param value - значение опции
   * @param field - имя поля фильтра
   */
  protected deleteSelectedOption(value: string, field: string) {
    if (!this.queryGroup[field]) return;
    const SELECTED_OPTION_INDEX = this.queryGroup[field].findIndex((optionValue: string) => optionValue === value);
    this.queryGroup[field].splice(SELECTED_OPTION_INDEX, 1);
  }

  /**
   * Открытие модуля добавления мебели
   */
  protected openAddModule() {
    const JWT = this.accountCookieService.getJwt()
    if(!JWT)this.router.navigateByUrl('/login')
    this.openAddModuleToggle = true;
  }

  /**
   * Закрытие модуля добавления мебели
   */
  protected closeAddModule() {
    this.openAddModuleToggle = false;
  }

  /**
   * Функция проверки, десктоп ли устройство (из reusable функций)
   */
  protected checkDesktop = checkDesktop;

  /**
   * Смена категории мебели
   * @param categoryIndex - индекс выбранной категории
   */
  protected changeCategory(categoryIndex: number | undefined) {
    this.furnituresArray.length = 0;
    this.currentCategoryId = categoryIndex;
    let newUrl = '/shop';
    if (categoryIndex !== undefined) {
      this.categoryName = this.categoryArray[categoryIndex].name;
      newUrl += '/' + this.categoryArray[categoryIndex].name;
    } else {
      this.categoryName = undefined;
    }
    this.location.replaceState(newUrl);
    this.furnituresInit();
    this.initQueryGroup();
  }

  /**
   * Закрытие карточки мебели и переход к списку мебели в категории
  */
  protected closeFurniture() {
    this.router.navigateByUrl('/shop' + (this.categoryName === 'all' ? '' : ('/' + this.categoryName)));
  }

  /**
   * Получение URL для плана по ID плана, комнаты и мебели
   * @param planId - ID плана
   * @param roomId - ID комнаты
   * @returns строка URL
   */
  protected getPlanUrl(planId: number, roomId: number) {
    return `/plan/${planId}/${roomId}/${this.furnitureCardId}`;
  }

  /**
   * Функция для оптимизации *ngFor - отслеживание по уникальному ID
   * @param index - индекс элемента
   * @param item - элемент массива
   * @returns ID элемента
   */
  protected trackByFn(index: number, item: any): number {
    return item.id;
  }

  /**
   * Получение массива мебели с учетом выбранных цветов и стоимости из фильтров
   * @returns отфильтрованный массив мебели
   */
  protected getClientFilteredFurnitures() {
    if (!this.costForm.valid) return [];
    return this.furnituresArray.filter(furnitureData => {
      const hasColorMatch = this.selectedColors.length === 0 ||
        [...new Set([...furnitureData.colors, ...this.selectedColors])].length
        < furnitureData.colors.length + this.selectedColors.length;

      const { minCost, maxCost } = this.costForm.value;
      const isInPriceRange = +(minCost || -Infinity) <= furnitureData.cost &&
        furnitureData.cost <= +(maxCost || Infinity);

      return hasColorMatch && isInPriceRange;
    });
  }

  
  /** Форма для фильтрации по стоимости с валидацией */
  protected costForm = new FormGroup({
    minCost: new FormControl(null, [this.numberOrEmptyValidator]),
    maxCost: new FormControl(null, [this.numberOrEmptyValidator])
  });
}
