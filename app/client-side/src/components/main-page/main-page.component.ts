import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import { CreateFurnitureComponent } from '../create-furnitre/create-furniture.component';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { PlanHouseComponent } from '../plan-house/plan-house.component';
import { NgClass, NgIf } from '@angular/common';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { Router, RouterLink } from '@angular/router';
import { furnitureExampleData, planHouseExampleData } from '../../usable/main-page.mock';

/**
 * Компонент главной страницы.
 * Управляет отображением различных секций для создания мебели, планировки дома и просмотра мебели.
 */
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CreateFurnitureComponent, ViewFurnitureComponent, PlanHouseComponent, NgClass, NavigationPanelComponent, RouterLink, NgIf],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements AfterViewInit {

  constructor(
    private elementRef: ElementRef, /** Элемент компонента */
    private router: Router /** Сервис для навигации */
  ) {}

  /** Текущий отображаемый шаблон: 'view' или 'create' */
  protected furnitureTemplate: 'view' | 'create' = 'create';

  /** Пример данных мебели */
  protected furnitureExampleData = furnitureExampleData;

  /** Пример данных планировки дома */
  protected planHouseExampleData = planHouseExampleData;

  /** Флаг для определения, находится ли пользователь на мобильном устройстве */
  protected isMobileView: boolean = false;

  /**
   * Инициализация компонента после загрузки представления.
   * Отключает события для дочерних элементов в компонентах CreateFurniture и PlanHouse.
   */
  ngAfterViewInit(): void {
    (this.elementRef.nativeElement.querySelectorAll('app-create-furniture,app-plan-house') as NodeListOf<HTMLElement>).forEach(elem => {
      elem.querySelectorAll<HTMLElement>('*').forEach(child => {
        child.setAttribute('tabindex', "-1"); /** Отключает фокусировку для дочерних элементов */
        child.style.pointerEvents = 'none'; /** Отключает взаимодействие с дочерними элементами */
      });
    });
  }

  /**
   * Проверка на мобильную версию при инициализации компонента.
   * Устанавливает флаг isMobileView в зависимости от ширины окна.
   */
  ngOnInit() {
    this.checkViewport();
  }

  /**
   * Слушатель события изменения размера окна.
   * Обновляет флаг isMobileView.
   * @param event Событие resize окна
   */
  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 600; /** Если ширина экрана меньше или равна 600px, устанавливает флаг для мобильного вида */
  }

  /**
   * Фокусирует элемент ввода с классом 'finderInput', если он существует.
   */
  protected focusFinder() {
    const FINDER_ELEMENT = this.elementRef.nativeElement.querySelector('.finderInput');
    if (!FINDER_ELEMENT) return;
    FINDER_ELEMENT.focus();
  }

  /**
   * Открывает шаблон для просмотра мебели.
   */
  protected openViewFurniture() {
    this.furnitureTemplate = 'view'; /** Устанавливает шаблон 'view' */
  }

  /**
   * Открывает шаблон для создания новой мебели.
   */
  protected openCreateFurniture() {
    this.furnitureTemplate = 'create'; /** Устанавливает шаблон 'create' */
  }

  /**
   * Навигация по приложению.
   * @param link Ссылка для перехода на другую страницу
   */
  protected navigateToPage(link: string) {
    this.router.navigateByUrl(link); /** Перенаправляет на указанную страницу */
  }
}
