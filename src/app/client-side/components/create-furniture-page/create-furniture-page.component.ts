import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CreateFurnitureComponent } from '../create-furnitre/create-furniture.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserCookieService } from '../../services/account-cookie.service';
import { additionalData, colorFromServerData, FurnitureCardControlService, furnitureFromServerData } from '../../services/furniture-card-control.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { NgIf } from '@angular/common';
import { FurnitureModelControlService } from '../../services/furniture-model-control.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { imageSliderClientData } from '../image-slider/image-slider.component';

@Component({
  selector: 'app-create-furniture-page',
  standalone: true,
  imports: [NavigationPanelComponent, CreateFurnitureComponent, NgIf],
  templateUrl: './create-furniture-page.component.html',
  styleUrl: './create-furniture-page.component.scss'
})
export class CreateFurniturePageComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private cookieService: UserCookieService,
    private furnitureCardService: FurnitureCardControlService,
    private serverImageControl: ServerImageControlService,
    private router: Router,
    private furnitureModelService: FurnitureModelControlService,
    private errorHandler: ErrorHandlerService
  ) { }

  idPage!: string
  @ViewChild(CreateFurnitureComponent)
  private createFurnitureComponent!: CreateFurnitureComponent;
  furnitureData: furnitureFromServerData = {
    name: '',
    description: '',
    colors: [],
    shops: [],
    additionalData: {},
    proportions: {
      width: 0,
      height: 0,
      length: 0
    }
  }

  ngOnInit(): void {
    const jwt = this.cookieService.getJwt()
    if (!jwt) {
      this.router.navigateByUrl('/login')
      return
    }
    this.idPage = this.route.snapshot.paramMap.get('id')!;
    if (this.idPage === 'new') return
    this.pageInit(jwt)
  }
  async pageInit(jwt: string) {
    try {
      const response = await this.furnitureCardService.GETfurnitureCard(this.idPage, jwt)
      if (response.authorMatched === false) {
        this.router.navigateByUrl('/create/new');
        return;
      }
      this.furnitureData = response.furnitureCard
      this.createFurnitureComponent.currentColorId = 0;
    } catch (error) {
      console.log(error)
    }
  }

  private async fetchBlobUrls(requestUrls: string[]): Promise<Blob[]> {
    return await Promise.all(
      requestUrls.map(async (blobUrl): Promise<Blob> => {
        const response = await fetch(blobUrl.toString());
        const blob = await response.blob();
        return blob;
      })
    );
  }

  async transformUrlArrayToBlob(imagesArray: string[]) {
    const imagesBlobArray: Blob[] = await Promise.all(
      imagesArray.map(async (blobUrl): Promise<Blob> => {
        const response = await fetch(blobUrl.toString());
        const blob = await response.blob();
        return blob;
      })
    );
    return imagesBlobArray
  }
  checkValid(typeRequest: 'update' | 'create') {
    const { name, colors, shops, proportions } = this.furnitureData
    if (!name || !colors || !shops || !proportions) return
    const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
    if (
      name.length < 3 ||
      (!FURNITURE_MODEL_BLOB && typeRequest === 'create') ||
      shops.length < 0
    ) return false
    if (!proportions.height || !proportions.width || !proportions.length) return false
    colors.forEach(colorData => {
      return colorData.imagesData.images.length > 0 && typeRequest === 'create'
    })
    return true
  }
  async createFurnitureCard() {
    const jwt = this.cookieService.getJwt()
    if (!this.checkValid('create') || !jwt) return
    try {
      const furnitureData = this.createFurnitureComponent.furnitureData;
      await this.furnitureCardService.POSTcreateFurnitureCard(furnitureData, jwt)

      furnitureData.colors.forEach(async (colorData) => {
        const imagesBlobArray = await this.transformUrlArrayToBlob(colorData.imagesData.images)
        const imagesData: imageSliderClientData = {
          images: imagesBlobArray,
          idMainImage: colorData.imagesData.idMainImage
        }
        await this.serverImageControl.POSTuploadProjectImages(colorData.color, imagesData, jwt, this.idPage)
      })

      const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
      await this.furnitureModelService.POSTuploadFurnitureModel(FURNITURE_MODEL_BLOB, jwt, this.idPage)

    } catch (error) {
      console.log(error)
    }

  }
  async updateFurnitureCard() {
    const jwt = this.cookieService.getJwt()
    if (!this.checkValid('update') || !jwt) return
    try {
      const furnitureData = this.createFurnitureComponent.furnitureData;
      await this.furnitureCardService.PUTupdateFurnitureCard(furnitureData, this.idPage, jwt)

      furnitureData.colors.forEach(async (colorData) => {
        if(colorData.imagesData.images.length===0)return
        const imagesBlobArray = await this.transformUrlArrayToBlob(colorData.imagesData.images)
        const imagesData: imageSliderClientData = {
          images: imagesBlobArray,
          idMainImage: colorData.imagesData.idMainImage
        }
        await this.serverImageControl.POSTuploadProjectImages(colorData.color, imagesData, jwt, this.idPage)
      })
      const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files!
      if(FURNITURE_MODEL_BLOB[0]) await this.furnitureModelService.POSTuploadFurnitureModel(FURNITURE_MODEL_BLOB[0],jwt,this.idPage)
    } catch (error) {
      console.log(error)
    }
  }
  clearFurnitureCard() {
    this.createFurnitureComponent.currentColorId = undefined
    this.furnitureData = {
      name: '',
      description: '',
      colors: [],
      shops: [],
      additionalData:{

      },
      proportions: {
        width: 0,
        height: 0,
        length: 0
      }
    }
  }
  async deleteFurnitureCard() {
    const jwt = this.cookieService.getJwt()
    if (!jwt) return
    try {
      await this.serverImageControl.DELETEproject(jwt, this.idPage)
      await this.furnitureCardService.DELETEfurnitureCard(jwt, this.idPage)
      this.router.navigateByUrl('/account')   
    } catch (error) {
      console.log(error)
    }

  }
  deleteColorCalculate() {
    if (!this.createFurnitureComponent || this.createFurnitureComponent.currentColorId === undefined) return
    return this.createFurnitureComponent.furnitureData.colors[this.createFurnitureComponent.currentColorId].color
  }
  deleteColor() {
    if (this.createFurnitureComponent.furnitureData.colors.length <= 1) return
    this.createFurnitureComponent.deleteColor()
  }
  getCurrentColorId() {
    if (!this.createFurnitureComponent) return
    return this.createFurnitureComponent.currentColorId
  }
}
