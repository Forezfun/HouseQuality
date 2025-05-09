import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, NgClass, NgFor, NgIf } from '@angular/common';
import { furnitureShopData, ShopService } from '../../services/shop.service';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { AccountService } from '../../services/account.service';
import { UserCookieService } from '../../services/account-cookie.service';
import { projectInformation } from '../../services/project.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { categoryData, CategoryService } from '../../services/category.service';
@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ViewFurnitureComponent, RouterLink, NgClass, RouterLink],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent implements OnInit {
  furnitureId: undefined | string = undefined
  categoryName: undefined | string = undefined
  userProjects: projectInformation[] | undefined = undefined
  currentCategoryId: number | undefined
  furnituresArray: furnitureShopData[] = []
  openAddModuleToggle: boolean = false
  categoryArray: categoryData[] = []
  constructor(
    private route: ActivatedRoute,
    private shopService: ShopService,
    private router: Router,
    private userService: AccountService,
    private userCookieService: UserCookieService,
    private errorHandler: ErrorHandlerService,
    private categoryService: CategoryService,
    private location: Location,
    private elementRef: ElementRef
  ) { }
  openAddModule() {
    this.openAddModuleToggle = true
  }
  closeAddModule() {
    this.openAddModuleToggle = false
  }
  ngOnInit() {
    this.processRouteParams();
    console.log('init');
  }

  private processRouteParams() {
    const params = this.route.snapshot.params;

    this.furnitureId = params['furnitureId'];
    this.categoryName = params['category'];

    this.furnituresInit();
    this.initCategories();
  }
  async initCategories() {
    try {
      this.categoryArray = (await this.categoryService.GETgetAllCategories()).categoryArray
      this.categoryArray.forEach((categoryData, index) => {
        if (this.categoryName === categoryData.name) this.currentCategoryId = index
      })
    } catch (error) {
      console.log(error)
    }
  }
  async furnituresInit() {
    if (this.furnitureId) {
      const jwt = this.userCookieService.getJwt()
      try {
        this.userProjects = (await this.userService.GETaccount(jwt)).accountData.projects
      } catch (error) {
        console.log(error)
      }
    } else if (this.categoryName !== undefined) {
      await this.requestCategoryFurnitures(this.categoryName, 0)
    } else {
      await this.requestAllFurnitures(0)
    }

  }
  async requestCategoryFurnitures(categoryName: string, furnituresCount: number) {
    const furnitures = (await this.shopService.GETgetCategoryData(categoryName, furnituresCount)).resultsArray
    this.furnituresArray = [...this.furnituresArray, ...furnitures]
  }
  async requestAllFurnitures(furnituresCount: number) {
    const furnitures = (await this.shopService.GETgetAllFurnitures(furnituresCount)).resultsArray
    this.furnituresArray = [...this.furnituresArray, ...furnitures]


  }
  checkDesktop() {
    return /windows nt|macintosh|x11|linux/.test(navigator.userAgent.toLowerCase())
  }
  getUrlForBlobImage(blob: Blob) {
    return URL.createObjectURL(blob)
  }
  changeCategory(categoryIndex: number | undefined) {
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
  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  closeFurniture() {
    this.router.navigateByUrl('/shop' + (this.categoryName === 'all' ? '' : ('/' + this.categoryName)))
  }
  getPlanUrl = (planId: number, roomId: number) => `/plan/${planId}/${roomId}/${this.furnitureId}`
  setScrollObserver() {
    const scrollContainer = this.elementRef.nativeElement.querySelector('.category') as HTMLSpanElement
    const items = scrollContainer.querySelectorAll('.furnitureItem') as NodeListOf<HTMLDivElement>
    let observedCount = 0;

    const observerOptions = {
      root: scrollContainer,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const item = entry.target as HTMLDivElement;
          const itemIndex: number = Array.from(items).indexOf(item);

          if ((itemIndex + 1) % 8 === 0 && !item.dataset['observed']) {
            item.dataset['observed'] = 'true';
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

    const observer: IntersectionObserver = new IntersectionObserver(observerCallback, observerOptions);
    items.forEach((item: HTMLElement) => observer.observe(item));
  }
  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
