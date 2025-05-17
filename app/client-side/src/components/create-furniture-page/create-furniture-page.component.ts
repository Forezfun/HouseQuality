import { ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export interface clientProportions {
  width: number | null;
  height: number | null;
  length: number | null;
}
@Component({
  selector: 'app-create-furniture-page',
  standalone: true,
  imports: [NavigationPanelComponent, CreateFurnitureComponent, NgIf],
  templateUrl: './create-furniture-page.component.html',
  styleUrl: './create-furniture-page.component.scss'
})
export class CreateFurniturePageComponent implements OnInit, DoCheck, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private cookieService: AccountCookieService,
    private furnitureCardService: FurnitureCardControlService,
    private serverImageControl: ServerImageControlService,
    private router: Router,
    private furnitureModelService: FurnitureModelControlService,
    private notification: NotificationService
  ) { }

  private routeSub!: Subscription;
  protected idPage!: string
  protected isValid = false

  @ViewChild(CreateFurnitureComponent)
  private createFurnitureComponent!: CreateFurnitureComponent;

  protected furnitureData: furnitureFromServerData & { proportions: clientProportions } =
    {
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
    }

  ngOnInit(): void {
    const JWT = this.cookieService.getJwt()
    if (!JWT) {
      this.router.navigateByUrl('/login')
      return
    }
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.idPage = params.get('id') ?? 'new'
      this.clearFurnitureCard()
      if (this.idPage !== 'new') this.pageInit(JWT)
    })
  }
  ngDoCheck() {
    this.isValid = !this.createFurnitureComponent || !this.checkValid(this.idPage === 'new' ? 'create' : 'update') ? false : true
  }
  ngOnDestroy() {
    this.routeSub.unsubscribe()
  }

  private async pageInit(jwt: string) {
    try {
      const RESPONSE = await this.furnitureCardService.GETfurnitureCard(this.idPage, jwt)
      if (RESPONSE.authorMatched === false) {
        this.router.navigateByUrl('/create/new');
        return;
      }
      this.furnitureData = RESPONSE.furnitureCard
      this.createFurnitureComponent.currentColorId = 0;
    } catch (error) {
      console.log(error)
    }
  }
  private async transformUrlArrayToBlob(imagesArray: string[]) {
    const IMAGES_BLOB_ARRAY: Blob[] = await Promise.all(
      imagesArray.map(async (blobUrl): Promise<Blob> => {
        const RESPONSE = await fetch(blobUrl.toString());
        const BLOB = await RESPONSE.blob();
        return BLOB;
      })
    );
    return IMAGES_BLOB_ARRAY
  }
  protected async deleteFurnitureCard() {
    const JWT = this.cookieService.getJwt()
    if (!JWT) return
    try {
      await this.furnitureModelService.DELETEfurnitureModel(JWT, this.idPage)
      await this.serverImageControl.DELETEproject(JWT, this.idPage)
      await this.furnitureCardService.DELETEfurnitureCard(JWT, this.idPage)
      this.router.navigateByUrl('/account')
    } catch (error) {
      console.log(error)
    }

  }
  protected async createFurnitureCard() {
    const JWT = this.cookieService.getJwt()
    console.log(this.createFurnitureComponent.furnitureData)
    if (!this.checkValid('create', true) || !JWT) return
    try {
      const FURNITURE_DATA = this.createFurnitureComponent.furnitureData;
      const FURNITURE_ID = (await this.furnitureCardService.POSTcreateFurnitureCard(FURNITURE_DATA, JWT)).furnitureData._id

      FURNITURE_DATA.colors.forEach(async (colorData) => {
        const imagesBlobArray = await this.transformUrlArrayToBlob(colorData.imagesData.images)
        const imagesData: imageSliderClientData = {
          images: imagesBlobArray,
          idMainImage: colorData.imagesData.idMainImage
        }
        await this.serverImageControl.POSTuploadProjectImages(colorData.color, imagesData, JWT, FURNITURE_ID)
      })

      const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
      await this.furnitureModelService.POSTuploadFurnitureModel(FURNITURE_MODEL_BLOB, JWT, FURNITURE_ID)
      this.notification.setSuccess('Мебель добавлена', 5000)
      this.router.navigateByUrl('/account')
    } catch (error) {
      console.log(error)
    }

  }
  protected async updateFurnitureCard() {
    const JWT = this.cookieService.getJwt()
    if (!this.checkValid('update', true) || !JWT) return
    try {
      const FURNITURE_DATA = this.createFurnitureComponent.furnitureData;
      console.log(FURNITURE_DATA)
      await this.furnitureCardService.PUTupdateFurnitureCard(FURNITURE_DATA, this.idPage, JWT)

      FURNITURE_DATA.colors.forEach(async (colorData) => {
        if (colorData.imagesData.images.length === 0) return
        const IMAGES_BLOB_ARRAY = await this.transformUrlArrayToBlob(colorData.imagesData.images)
        const IMAGES_DATA: imageSliderClientData = {
          images: IMAGES_BLOB_ARRAY,
          idMainImage: colorData.imagesData.idMainImage
        }
        await this.serverImageControl.POSTuploadProjectImages(colorData.color, IMAGES_DATA, JWT, this.idPage)
      })
      const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files!
      if (FURNITURE_MODEL_BLOB[0]) await this.furnitureModelService.POSTuploadFurnitureModel(FURNITURE_MODEL_BLOB[0], JWT, this.idPage)
      this.notification.setSuccess('Мебель обновлена', 5000)
    } catch (error) {
      console.log(error)
    }
  }
  protected checkValid(typeRequest: 'update' | 'create', action: boolean = false) {
    const { colors, shops, proportions } = this.furnitureData
    const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
    if (colors.length == 0) {
      if (action) this.createFurnitureComponent.openColorModule()
      return false
    }
    if (!proportions.height || !proportions.width || !proportions.length) {
      if (action) {
        this.createFurnitureComponent.openAdditional()
        this.notification.setError('Заполните параметры', 5000)
      }
      return false
    }
    if (!FURNITURE_MODEL_BLOB && typeRequest === 'create') {
      if (action) this.notification.setError('Загрузите 3D модель', 5000)
      return false
    }
    if (shops.length == 0) {
      if (action) this.notification.setError('Добавьте магазины', 5000)
      return false
    }
    for (let colorData of colors) {
      if (colorData.imagesData.images.length == 0 && typeRequest === 'create') {
        if (action) this.notification.setError('Загрузите изображения', 5000)
        return false
      }
    }
    return true
  }
  protected clearFurnitureCard() {
    if (this.createFurnitureComponent) this.createFurnitureComponent.currentColorId = undefined
    this.furnitureData = {
      name: '',
      description: '',
      colors: [],
      shops: [],
      additionalData: {

      },
      proportions: {
        width: null,
        height: null,
        length: null
      }
    }
  }
  protected deleteColorCalculate() {
    if (!this.createFurnitureComponent || this.createFurnitureComponent.currentColorId === undefined) return
    console.log('color: ',this.createFurnitureComponent.furnitureData.colors[this.createFurnitureComponent.currentColorId].color)
    return this.createFurnitureComponent.furnitureData.colors[this.createFurnitureComponent.currentColorId].color
  }
  protected deleteColor() {
    if (this.createFurnitureComponent.furnitureData.colors.length <= 1) {
      this.notification.setError('Добавьте еще цвет', 500)
      return
    }
    this.createFurnitureComponent.deleteColor()
  }
  protected getCurrentColorId() {
    if (!this.createFurnitureComponent) return
    return this.createFurnitureComponent.currentColorId
  }
}
