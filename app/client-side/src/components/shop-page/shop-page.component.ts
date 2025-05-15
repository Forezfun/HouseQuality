import { Component, ElementRef, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, NgClass, NgFor, NgIf } from '@angular/common';
import { furnitureShopData, ShopService } from '../../services/shop.service';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { AccountService } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { projectInformation } from '../../services/project.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { categoryData, CategoryService } from '../../services/category.service';
import { checkDesktop } from '../../usable/reusable-functions.used';
import { CostFormatPipe } from '../../pipes/cost-format.pipe';

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ViewFurnitureComponent, RouterLink, NgClass, RouterLink, CostFormatPipe],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private shopService: ShopService,
    private router: Router,
    private accountService: AccountService,
    private accountCookieService: AccountCookieService,
    private errorHandler: ErrorHandlerService,
    private categoryService: CategoryService,
    private location: Location,
    private elementRef: ElementRef
  ) { }

  protected furnitureId: undefined | string
  protected categoryName: undefined | string
  protected accountProjects: projectInformation[] | undefined
  protected currentCategoryId: number | undefined
  protected furnituresArray: furnitureShopData[] = []
  protected openAddModuleToggle: boolean = false
  protected categoryArray: categoryData[] = []

  ngOnInit() {
    this.processRouteParams();
  }

  private async initCategories() {
    try {
      this.categoryArray = (await this.categoryService.GETgetAllCategories()).categoryArray
      this.categoryArray.forEach((categoryData, index) => {
        if (this.categoryName === categoryData.name) this.currentCategoryId = index
      })
    } catch (error) {
      console.log(error)
    }
  }
  private async furnituresInit() {
    if (this.furnitureId) {
      const JWT = this.accountCookieService.getJwt()
      if(!JWT)return
      try {
        this.accountProjects = (await this.accountService.GETaccount(JWT)).accountData.projects
      } catch (error) {
        console.log(error)
      }
    } else if (this.categoryName !== undefined) {
      await this.requestCategoryFurnitures(this.categoryName, 0)
    } else {
      await this.requestAllFurnitures(0)
    }

  }
  private async requestCategoryFurnitures(categoryName: string, furnituresCount: number) {
    const FURNITURES = (await this.shopService.GETgetCategoryData(categoryName, furnituresCount)).resultsArray
    this.furnituresArray = [...this.furnituresArray, ...FURNITURES]
  }
  private async requestAllFurnitures(furnituresCount: number) {
    const FURNITURES = (await this.shopService.GETgetAllFurnitures(furnituresCount)).resultsArray
    this.furnituresArray = [...this.furnituresArray, ...FURNITURES]
  }

  private processRouteParams() {
    const PARAMS = this.route.snapshot.params;

    this.furnitureId = PARAMS['furnitureId'];
    this.categoryName = PARAMS['category'];

    this.furnituresInit();
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
              await this.requestCategoryFurnitures(this.categoryName, this.furnituresArray.length)
            } else {
              await this.requestAllFurnitures(this.furnituresArray.length)
            }
          }
        }
      });
    };

    const OBSERVER: IntersectionObserver = new IntersectionObserver(OBSERVER_CALLBACK, observerOptions);
    items.forEach((item: HTMLElement) => OBSERVER.observe(item));
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
    let newUrl = this.location.path()
    if (categoryIndex !== undefined) {
      this.categoryName = this.categoryArray[categoryIndex].name
      newUrl += '/' + this.categoryArray[categoryIndex].name
    } else {
      this.categoryName = undefined
      newUrl = '/shop'
    }
    this.location.replaceState(newUrl)
    this.furnituresInit()
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
}
