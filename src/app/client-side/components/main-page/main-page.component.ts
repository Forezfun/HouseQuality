import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import { CreateFurnitureComponent } from '../create-furnitre/create-furniture.component';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { PlanHouseComponent } from '../plan-house/plan-house.component';
import { NgClass, NgIf } from '@angular/common';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { Router, RouterLink } from '@angular/router';
import { furnitureExampleData, planHouseExampleData } from '../../usable/main-page.mock';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CreateFurnitureComponent, ViewFurnitureComponent, PlanHouseComponent, NgClass, NavigationPanelComponent, RouterLink, NgIf],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements AfterViewInit {
  constructor(
    private elementRef: ElementRef,
    private router: Router
  ) { }

  protected furnitureTemplate: 'view' | 'create' = 'create'
  protected furnitureExampleData = furnitureExampleData
  protected planHouseExampleData = planHouseExampleData
  protected isMobileView: boolean = false;

  ngAfterViewInit(): void {
    (this.elementRef.nativeElement.querySelectorAll('app-create-furniture,app-plan-house') as NodeListOf<HTMLElement>).forEach(elem => {
      elem.querySelectorAll<HTMLElement>('*').forEach(child => {
        child.setAttribute('tabindex', "-1");
        child.style.pointerEvents = 'none';
      });
    });
  }
  ngOnInit() {
    this.checkViewport();
  }

  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 600;
  }
  protected focusFinder() {
    const FINDER_ELEMENT = this.elementRef.nativeElement.querySelector('.finderInput')
    if (!FINDER_ELEMENT) return
    FINDER_ELEMENT.focus()
  }
  protected openViewFurniture() {
    this.furnitureTemplate = 'view'
  }
  protected openCreateFurniture() {
    this.furnitureTemplate = 'create'
  }
  protected navigateToPage(link: string) {
    this.router.navigateByUrl(link)
  }
}
