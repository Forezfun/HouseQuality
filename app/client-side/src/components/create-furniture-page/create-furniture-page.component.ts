import { ChangeDetectorRef, Component, DoCheck, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CreateFurnitureComponent } from '../create-furnitre/create-furniture.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountCookieService } from '../../services/account-cookie.service';
import { FurnitureCardControlService, furnitureFromServerData } from '../../services/furniture-card-control.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { NgIf } from '@angular/common';
import { FurnitureModelControlService } from '../../services/furniture-model-control.service';
import { NotificationService } from '../../services/notification.service';
import { imageSliderClientData } from '../image-slider/image-slider.component';
import { Subscription } from 'rxjs';

/** Данные для формы габаритов мебели на клиенте.*/
interface clientProportions {
  width: number | null;
  height: number | null;
  length: number | null;
}

/**
 * Компонент страницы создания и редактирования мебели.
 * Отвечает за загрузку данных, валидацию, сохранение и удаление мебели.
 */
@Component({
  selector: 'app-create-furniture-page',
  standalone: true,
  imports: [NavigationPanelComponent, CreateFurnitureComponent, NgIf],
  templateUrl: './create-furniture-page.component.html',
  styleUrl: './create-furniture-page.component.scss'
})
export class CreateFurniturePageComponent implements OnInit, OnDestroy {
  /** Подписка на изменения маршрута в приложении.*/
  private routeSub: Subscription = new Subscription();
  /** Id страницы.*/
  protected idPage!: string;
  
  @ViewChild(CreateFurnitureComponent)
  /** Переменная для взаимодействия с методами дочернего компонента.*/
  private createFurnitureComponent!: CreateFurnitureComponent;
  
  @ViewChild(CreateFurnitureComponent, { read: ElementRef })
  /** Переменная для взаимодействия с html дочернего компонента.*/
  private createFurnitureComponentRef!: ElementRef<HTMLElement>;

  /**
   * Данные мебели с дополнительным полем пропорций клиента.
   */
  protected furnitureData: furnitureFromServerData & { proportions: clientProportions } = {
    name: '',
    description: '',
    colors: [],
    shops: [],
    additionalData: {},
    proportions: {
      width: null,
      height: null,
      length: null
    }
  };

  constructor(
    private route: ActivatedRoute,
    private cookieService: AccountCookieService,
    private furnitureCardService: FurnitureCardControlService,
    private serverImageControl: ServerImageControlService,
    private router: Router,
    private furnitureModelService: FurnitureModelControlService,
    private notification: NotificationService
  ) { }

  /**
   * Инициализация компонента:
   * - проверяет JWT,
   * - подписывается на изменения параметров маршрута,
   * - загружает мебель, если id не "new".
   */
  ngOnInit(): void {
    const JWT = this.cookieService.getJwt();
    if (!JWT) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.idPage = params.get('id') ?? 'new';
      this.clearFurnitureCard();
      if (this.idPage !== 'new') this.pageInit(JWT);
    });
  }

  /**
   * Отписка от подписки при уничтожении компонента.
   */
  ngOnDestroy() {
    if(this.routeSub)this.routeSub.unsubscribe();
  }

  /**
   * Загружает данные мебели по id и JWT.
   * Если автор не совпадает, происходит перенаправление на создание новой мебели.
   * @param jwt - JWT токен пользователя.
   */
  private async pageInit(jwt: string) {
    try {
      const RESPONSE = await this.furnitureCardService.GETfurnitureCard(this.idPage, jwt);
      if (RESPONSE.authorMatched === false) {
        this.router.navigateByUrl('/create/new');
        return;
      }
      this.furnitureData = RESPONSE.furnitureCard;
      this.createFurnitureComponent.currentColorId = 0;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Преобразует массив URL строк изображений в массив Blob объектов.
   * @param imagesArray - массив URL строк изображений.
   * @returns Promise с массивом Blob объектов.
   */
  private async transformUrlArrayToBlob(imagesArray: string[]): Promise<Blob[]> {
    const IMAGES_BLOB_ARRAY: Blob[] = await Promise.all(
      imagesArray.map(async (blobUrl): Promise<Blob> => {
        const RESPONSE = await fetch(blobUrl.toString());
        const BLOB = await RESPONSE.blob();
        return BLOB;
      })
    );
    return IMAGES_BLOB_ARRAY;
  }

  /**
   * Удаляет мебель, 3D модель и связанные изображения с сервера.
   */
  protected async deleteFurnitureCard() {
    const JWT = this.cookieService.getJwt();
    if (!JWT) return;
    try {
      await this.furnitureModelService.DELETEfurnitureModel(JWT, this.idPage);
      await this.serverImageControl.DELETEproject(JWT, this.idPage);
      await this.furnitureCardService.DELETEfurnitureCard(JWT, this.idPage);
      this.router.navigateByUrl('/account');
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Создаёт новую мебель:
   * - проверяет валидность,
   * - создаёт карточку,
   * - загружает изображения по цветам,
   * - загружает 3D модель,
   * - показывает уведомление и перенаправляет пользователя.
   */
  protected async createFurnitureCard() {
    const JWT = this.cookieService.getJwt();
    if (!this.checkValid('create') || !JWT) return;
    try {
      const FURNITURE_DATA = this.createFurnitureComponent.furnitureData;
      const FURNITURE_ID = (await this.furnitureCardService.POSTcreateFurnitureCard(FURNITURE_DATA, JWT)).furnitureData._id;

      // Загрузка изображений по цветам
      FURNITURE_DATA.colors.forEach(async (colorData) => {
        const imagesBlobArray = await this.transformUrlArrayToBlob(colorData.imagesData.images);
        const imagesData: imageSliderClientData = {
          images: imagesBlobArray,
          idMainImage: colorData.imagesData.idMainImage
        };
        await this.serverImageControl.POSTuploadProjectImages(colorData.color, imagesData, JWT, FURNITURE_ID);
      });

      // Загрузка 3D модели
      const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0];
      this.furnitureModelService.POSTuploadFurnitureModel(FURNITURE_MODEL_BLOB, JWT, FURNITURE_ID);

      this.notification.setSuccess('Мебель добавлена', 5000);
      this.router.navigateByUrl('/account');
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Обновляет данные мебели:
   * - проверяет валидность,
   * - обновляет карточку мебели,
   * - обновляет изображения,
   * - при необходимости загружает новую 3D модель,
   * - показывает уведомление об успешном обновлении.
   */
  protected async updateFurnitureCard() {
    const JWT = this.cookieService.getJwt();
    if (!this.checkValid('update') || !JWT) return;
    try {
      const FURNITURE_DATA = this.createFurnitureComponent.furnitureData;
      await this.furnitureCardService.PUTupdateFurnitureCard(FURNITURE_DATA, this.idPage, JWT);

      // Загрузка изображений по цветам, если есть
      FURNITURE_DATA.colors.forEach(async (colorData) => {
        if (colorData.imagesData.images.length === 0) return;
        const IMAGES_BLOB_ARRAY = await this.transformUrlArrayToBlob(colorData.imagesData.images);
        const IMAGES_DATA: imageSliderClientData = {
          images: IMAGES_BLOB_ARRAY,
          idMainImage: colorData.imagesData.idMainImage
        };
        await this.serverImageControl.POSTuploadProjectImages(colorData.color, IMAGES_DATA, JWT, this.idPage);
      });

      // Загрузка 3D модели, если файл выбран
      const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files!;
      if (FURNITURE_MODEL_BLOB[0]) {
        await this.furnitureModelService.POSTuploadFurnitureModel(FURNITURE_MODEL_BLOB[0], JWT, this.idPage);
      }

      this.notification.setSuccess('Мебель обновлена', 5000);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Проверяет валидность данных мебели.
   * @param typeRequest - тип операции ('create' или 'update').
   * @param action - если true, то при ошибке вызываются уведомления и открываются необходимые модули.
   * @returns true, если данные валидны, иначе false.
   */
  protected checkValid(typeRequest: 'update' | 'create'): boolean {
    const { colors, shops, proportions, name } = this.furnitureData;
    const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0];

    if (colors.length == 0) {
      this.createFurnitureComponent.openColorModule();
      return false;
    }
    if (name.length == 0) {
      const nameInput = this.createFurnitureComponentRef.nativeElement.querySelector(
        '.furnitureTitle'
      ) as HTMLInputElement;

      if (nameInput) {
        nameInput.focus();
      }
      this.notification.setError('Заполните название мебели', 5000);
      return false;
    }
    if (!proportions.height || !proportions.width || !proportions.length) {
      this.createFurnitureComponent.openAdditional();
      this.notification.setError('Заполните параметры', 5000);
      return false;
    }
    if (!FURNITURE_MODEL_BLOB && typeRequest === 'create') {
      const uploadInput = this.createFurnitureComponentRef.nativeElement.querySelector(
        '.furnitureModelInput'
      ) as HTMLInputElement;

      if (uploadInput) {
        uploadInput.click();
      }
      this.notification.setError('Загрузите 3D модель', 5000);
      return false;
    }
    if (shops.length == 0) {
      this.createFurnitureComponent.openShopsModule();
      this.notification.setError('Добавьте магазины', 5000);
      return false;
    }
    for (let colorData of colors) {
      if (colorData.imagesData.images.length == 0 && typeRequest === 'create') {
        const uploadInput = this.createFurnitureComponentRef.nativeElement.querySelector(
          '.uploadImagesInput'
        ) as HTMLInputElement;

        if (uploadInput) {
          uploadInput.click();
        }
        this.notification.setError('Загрузите изображения', 5000);
        return false;
      }
    }
    return true;
  }

  /**
   * Очищает данные мебели в компоненте.
   */
  protected clearFurnitureCard() {
    if (this.createFurnitureComponent) this.createFurnitureComponent.currentColorId = undefined;
    this.furnitureData = {
      name: '',
      description: '',
      colors: [],
      shops: [],
      additionalData: {},
      proportions: {
        width: null,
        height: null,
        length: null
      }
    };
  }

  /**
   * Возвращает цвет, который планируется удалить (для расчётов и логирования).
   * @returns цвет (строка) текущего выделенного цвета или undefined.
   */
  protected deleteColorCalculate(): string | undefined {
    if (!this.createFurnitureComponent || this.createFurnitureComponent.currentColorId === undefined) return undefined;
    return this.createFurnitureComponent.furnitureData.colors[this.createFurnitureComponent.currentColorId].color;
  }

  /**
   * Удаляет текущий цвет, если цветов больше одного.
   * Если цветов один — показывает ошибку.
   */
  protected deleteColor() {
    if (this.createFurnitureComponent.furnitureData.colors.length <= 1) {
      this.notification.setError('Добавьте еще цвет', 500);
      return;
    }
    this.createFurnitureComponent.deleteColor();
  }

  /**
   * Возвращает текущий id выбранного цвета.
   * @returns id цвета или undefined.
   */
  protected getCurrentColorId(): number | undefined {
    if (!this.createFurnitureComponent) return undefined;
    return this.createFurnitureComponent.currentColorId;
  }
}
