import { NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';
import { FinderService } from '../../services/finder.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { checkDesktop } from '../../usable/reusable-functions.used';
import { CostFormatPipe } from '../../pipes/cost-format.pipe';

/**
 * Интерфейс, описывающий найденную мебель.
 */
interface foundFurniture {
  /** Название мебели */
  name: string;
  /** Цена мебели */
  cost: number;
  /** Цвет, указанный в запросе */
  colorRequest: string;
  /** Уникальный идентификатор мебели */
  id: string;
  /** Категория мебели */
  category: string;
}

/**
 * Компонент поиска мебели.
 * Позволяет искать мебель по названию и отображать результаты.
 */
@Component({
  selector: 'app-finder',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink, CostFormatPipe, RouterLink],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.scss'
})
export class FinderComponent implements AfterViewInit {
  /**
   * Ссылка на HTML-элемент с результатами поиска (список вариантов).
   */
  private variantsSpan!: HTMLSpanElement;

  /**
   * Ссылка на HTML-элемент текстового поля ввода.
   */
  private inputElement!: HTMLInputElement;

  /**
   * Массив найденных объектов мебели.
   */
  protected foundFurniture?: foundFurniture[];

  /**
   * Таймер для реализации дебаунса ввода.
   */
  private debounceTimer: any = null;

  constructor(
    private finderService: FinderService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private imageService: ServerImageControlService,
    private route: ActivatedRoute
  ) { }

  /**
   * Инициализация после рендера компонента:
   * Получение необходимых DOM-элементов для управления поиском.
   */
  ngAfterViewInit(): void {
    this.variantsSpan = this.elementRef.nativeElement.querySelector('.variantsSpan') as HTMLSpanElement;
    this.inputElement = this.elementRef.nativeElement.querySelector('.finderInput') as HTMLInputElement;
  }

  /**
   * Выполняет поиск мебели на сервере по заданной строке.
   * @param findString Строка для поиска мебели
   */
  private async findFurnitures(findString: string) {
    const RECEIVED_DATA = await this.finderService.GETfindFurnitures(findString) as foundFurniture[];
    this.openFoundResultsList();

    if (RECEIVED_DATA.length > 0) {
      this.closeFoundResultsList();
      setTimeout(() => {
        this.foundFurniture = RECEIVED_DATA;
        this.openFoundResultsList();
      }, 400);
    } else {
      // Если результатов нет, очищаем массив foundFurniture
      this.foundFurniture !== undefined ? this.foundFurniture.length = 0 : this.foundFurniture = [];
    }
  }

  /**
   * Открывает список найденных результатов (добавляет CSS класс).
   */
  private openFoundResultsList() {
    if (!this.variantsSpan) return;
    this.renderer.addClass(this.variantsSpan, 'variantsSpanOpen');
  }

  /**
   * Закрывает список найденных результатов (удаляет CSS класс).
   */
  private closeFoundResultsList() {
    if (!this.variantsSpan) return;
    this.renderer.removeClass(this.variantsSpan, 'variantsSpanOpen');
  }

  /**
   * Утилитная функция проверки, запущено ли приложение на десктопе.
   */
  protected checkDesktop = checkDesktop;

  /**
   * Очищает поле ввода и скрывает список результатов.
   */
  protected clearInput() {
    this.inputElement.value = '';
    this.inputProcess();
    this.closeFoundResultsList();
  }

  /**
   * Проверяет, находится ли пользователь на странице магазина.
   * Если да, устанавливает в сервисе имя мебели.
   * @param name Имя мебели для поиска
   * @returns true если на странице магазина, иначе false
   */
  private checkShopPage(name: string): boolean {
    let CURRENT_ROUTE = this.route.root;
    while (CURRENT_ROUTE.firstChild) {
      CURRENT_ROUTE = CURRENT_ROUTE.firstChild;
    }
    const component = CURRENT_ROUTE.snapshot.routeConfig?.component;
    console.log(component);
    if (component && component.name === '_ShopPageComponent') {
      this.finderService.setFurnitureName(name);
      return true;
    }
    return false;
  }

  /**
   * Обрабатывает ввод пользователя с задержкой (debounce).
   * Запускает поиск, если введена строка.
   */
  protected inputProcess() {
    const VALUE = this.inputElement.value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (VALUE.length === 0) {
        if (this.checkShopPage(VALUE)) this.closeFoundResultsList();
        return;
      }
      if (this.checkShopPage(VALUE)) return;

      this.findFurnitures(VALUE);
    }, 300);
  }

  /**
   * Возвращает URL главного изображения мебели по id и цвету.
   * @param idFurniture Идентификатор мебели
   * @param color Цвет мебели
   * @returns URL изображения
   */
  protected getImage(idFurniture: string, color: string): string {
    return this.imageService.GETmainImage(idFurniture, color);
  }

  /**
   * Формирует URL для перехода на страницу мебели.
   * @param idFurniture Идентификатор мебели
   * @param category Категория мебели
   * @returns URL для маршрутизации
   */
  protected getUrl(idFurniture: string, category: string): string {
    return `/shop/${category ?? 'all'}/${idFurniture}`;
  }
}
