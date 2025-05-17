import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JsonPipe, Location, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { clientFilters, furnitureShopData, queryData, ShopService } from '../../services/shop.service';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { AccountService } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { projectInformation } from '../../services/project.service';
import { NotificationService } from '../../services/notification.service';
import { categoryData, CategoryService, option } from '../../services/category.service';
import { checkDesktop } from '../../usable/reusable-functions.used';
import { CostFormatPipe } from '../../pipes/cost-format.pipe';
import { TuiInputRangeModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TuiRange } from '@taiga-ui/kit';
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

  private furnitureNameSubscription!: Subscription
  private funritureName: string = ''
  protected queryGroup: any = {}
  protected furnitureId: undefined | string
  protected categoryName: undefined | string
  protected accountProjects: projectInformation[] | undefined
  protected currentCategoryId: number | undefined
  protected furnituresArray: furnitureShopData[] = []
  protected openAddModuleToggle: boolean = false
  protected categoryArray: categoryData[] = []
  protected clientFiltersObject!: clientFilters
  protected selectedColors: string[] = []


  async ngOnInit() {
    this.clearClientFilters()
    this.processRouteParams();
    this.furnitureNameSubscription = this.finderService.furnitureName$.subscribe(name => {
      this.furnituresArray = []
      this.funritureName = name
      this.requestFurnitures(this.categoryName ?? 'all', 0, this.handleQueryData())
    })

    const JWT = this.accountCookieService.getJwt()
    if (!JWT) return
    try {
      this.accountProjects = (await this.accountService.GETaccount(JWT)).accountData.projects
    } catch (error) {
      console.log(error)
    }
  }
  ngOnDestroy(): void {
    this.furnitureNameSubscription.unsubscribe()
  }

  private async initCategories() {
    try {
      this.categoryArray = (await this.categoryService.GETgetAllCategories()).categoryArray
      this.categoryArray.forEach((categoryData, index) => {
        if (this.categoryName === categoryData.name) {
          this.currentCategoryId = index
          this.initQueryGroup()
        }
      })
    } catch (error) {
      console.log(error)
    }
  }
  private async furnituresInit() {
    if (this.categoryName !== undefined) {
      await this.requestFurnitures(this.categoryName, 0)
    } else {
      await this.requestFurnitures('all', 0)
    }
    this.setScrollObserver();
  }
  protected async requestFurnitures(categoryName: string, furnituresCount: number, queryData?: queryData) {
    const RESPONSE = await this.shopService.GETgetCategoryData(categoryName, furnituresCount, queryData)
    console.log(RESPONSE)
    this.furnituresArray = [...this.furnituresArray, ...RESPONSE.resultsArray]
    this.clientFiltersObject = RESPONSE.resultsClientFiltersData
  }

  private clearClientFilters() {
    this.clientFiltersObject = {
      colors: [],
      minCost: 0,
      maxCost: 0
    }
  }
  private initQueryGroup() {
    if (this.currentCategoryId === undefined) return
    this.queryGroup = {}
    this.categoryArray[this.currentCategoryId].filters.forEach(filterData => {
      if (filterData && filterData.type === 'select') {
        this.queryGroup[filterData.field] = []
      } else {
        this.queryGroup[filterData.field] = new FormGroup({
          min: new FormControl(null, [this.numberOrEmptyValidator]),
          max: new FormControl(null, [this.numberOrEmptyValidator])
        })
      }
    })
  }
  private numberOrEmptyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return isNaN(value) || value < 0 ? { notNumber: true } : null;
  }
  private processRouteParams() {
    const PARAMS = this.route.snapshot.params;

    this.furnitureId = PARAMS['furnitureId'];
    this.categoryName = PARAMS['category'];

    console.log('route')
    this.initCategories();
  }
  private setScrollObserver() {
    const SCROLL_CONTAINER = this.elementRef.nativeElement.querySelector('.category') as HTMLSpanElement
    const items = SCROLL_CONTAINER.querySelectorAll('.furnitureItem') as NodeListOf<HTMLDivElement>
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
              await this.requestFurnitures(this.categoryName, this.furnituresArray.length, this.handleQueryData())
            } else {
              await this.requestFurnitures('all', this.furnituresArray.length, this.handleQueryData())
            }
          }
        }
      });
    };

    const OBSERVER: IntersectionObserver = new IntersectionObserver(OBSERVER_CALLBACK, observerOptions);
    items.forEach((item: HTMLElement) => OBSERVER.observe(item));
  }
  protected checkViewport() {
    return window.innerWidth <= 768;
  }
  protected requestWithFilters() {
    this.furnituresArray.length = 0
    this.requestFurnitures(this.categoryName ?? 'all', 0, this.handleQueryData())
  }
  protected handleQueryData() {
    const QUERY_DATA: any = {}
    if (this.funritureName.length > 0) QUERY_DATA.name = this.funritureName
    Object.keys(this.queryGroup).forEach(key => {
      if (this.queryGroup[key] instanceof FormGroup) {
        if (!this.queryGroup[key].valid) return
        const { min, max } = this.queryGroup[key].value;
        if (+min > 0 || +max > 0) {
          QUERY_DATA[key] = {
            min: +min,
            max: +max
          };
        }
      } else {
        if (this.queryGroup[key].length > 0) {
          QUERY_DATA[key] = this.queryGroup[key]
        }
      }
    })
    console.log(QUERY_DATA)
    return QUERY_DATA
  }
  protected addSelectedColor(color: string) {
    this.selectedColors.push(color)
  }
  protected deleteSelectedColor(color: string) {
    const SELECTED_COLOR_INDEX = this.selectedColors.findIndex(value => value === color)
    this.selectedColors.splice(SELECTED_COLOR_INDEX, 1)
  }
  protected addSelectedOption(value: string, field: string) {
    if (!this.queryGroup[field]) return
    this.queryGroup[field].push(value)
  }
  protected deleteSelectedOption(value: string, field: string) {
    if (!this.queryGroup[field]) return
    const SELECTED_OPTION_INDEX = this.queryGroup[field].findIndex((optionValue: string) => optionValue === value)
    this.queryGroup[field].splice(SELECTED_OPTION_INDEX, 1)
  }
  protected openAddModule() {
    this.openAddModuleToggle = true
  }
  protected closeAddModule() {
    this.openAddModuleToggle = false
  }
  protected checkDesktop = checkDesktop
  protected changeCategory(categoryIndex: number | undefined) {
    this.furnituresArray.length = 0
    this.currentCategoryId = categoryIndex
    let newUrl = '/shop'
    if (categoryIndex !== undefined) {
      this.categoryName = this.categoryArray[categoryIndex].name
      newUrl += '/' + this.categoryArray[categoryIndex].name
    } else {
      this.categoryName = undefined
    }
    this.location.replaceState(newUrl)
    this.furnituresInit()
    this.initQueryGroup()
  }
  protected closeFurniture() {
    this.router.navigateByUrl('/shop' + (this.categoryName === 'all' ? '' : ('/' + this.categoryName)))
  }
  protected getPlanUrl(planId: number, roomId: number) {
    return `/plan/${planId}/${roomId}/${this.furnitureId}`
  }
  protected trackByFn(index: number, item: any): number {
    return item.id;
  }
  protected getClientFilteredFurnitures() {
    if (!this.costForm.valid) return []
    return this.furnituresArray.filter(furnitureData => {
      if (furnitureData.colors.some(color => this.selectedColors.includes(color))) return true;
      const { minCost, maxCost } = this.costForm.value
      if (+(minCost || -Infinity) <= furnitureData.cost && furnitureData.cost <= +(maxCost || Infinity)) return true;
      return false
    })
  }

  protected costForm = new FormGroup({
    minCost: new FormControl(null, [this.numberOrEmptyValidator]),
    maxCost: new FormControl(null, [this.numberOrEmptyValidator])
  })
}
