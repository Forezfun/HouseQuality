import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CreateFurnitureComponent, furnitureServerData, additionalData } from '../create-furnitre/create-furniture.component';
import { ActivatedRoute, Router } from '@angular/router';
import { imageSliderData } from '../image-slider/image-slider.component';
import { UserCookieService } from '../../services/user-cookie.service';
import { FurnitureCardControlService } from '../../services/furniture-card-control.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { NgIf } from '@angular/common';
import { FurnitureModelControlService } from '../../services/furniture-model-control.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-create-furniture-page',
  standalone: true,
  imports: [NavigationPanelComponent, CreateFurnitureComponent, NgIf],
  templateUrl: './create-furniture-page.component.html',
  styleUrl: './create-furniture-page.component.scss'
})
export class CreateFurniturePageComponent implements OnInit {
  @ViewChild(CreateFurnitureComponent)
  private createFurnitureComponent!: CreateFurnitureComponent;
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

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (this.idPage !== undefined) location.reload()
      this.idPage = params['id'];
      if (this.idPage === 'new') return
      const jwt = this.cookieService.getJwt()
      if (!jwt) {
        this.router.navigateByUrl('/login')
        return
      }
      this.furnitureCardService.GETfurnitureCard(this.idPage, jwt)
        .subscribe({
          next: async (response) => {
            const RECEIVED_DATA: furnitureServerData = response.furnitureCard
            if (response.authorMatched === false) {
              this.router.navigateByUrl('/create/new')
              return
            }
            this.furnitureData.name = RECEIVED_DATA.name,
              this.furnitureData.description = RECEIVED_DATA.description,
              this.furnitureData.shops = RECEIVED_DATA.shops
            const COLORS_PROMISES = RECEIVED_DATA.colors.map(async (colorObject: any) => {

              const IMAGES_DATA = await this.serverImageControl.GETallProjectImages(this.idPage, colorObject.color)
              const IMAGES_URLS: string[] = IMAGES_DATA.imagesURLS
              const REQUEST_URLS: string[] = IMAGES_URLS.map(url => this.serverImageControl.GETsimpleImage(url))
              const BLOB_URLS: Blob[] = await Promise.all(
                REQUEST_URLS.map(async (blobUrl): Promise<Blob> => {
                  const response = await fetch(blobUrl.toString());
                  const blob = await response.blob();
                  return blob;
                })
              );
              this.furnitureData.colors.push({
                color: colorObject.color,
                imagesData: {
                  images: BLOB_URLS,
                  idMainImage: IMAGES_DATA.idMainImage
                }
              })
              this.colorsClientData.push({
                color: colorObject.color,
                imagesData: {
                  images: REQUEST_URLS,
                  idMainImage: IMAGES_DATA.idMainImage
                }
              })

            })
            await Promise.all(COLORS_PROMISES);
            this.createFurnitureComponent.currentColorId = 0
          },
          error: (error) => {
            console.log(error)
            this.errorHandler.setError('Error while loading furniture', 5000)
          }
        })
    });
  }
  furnitureData: furnitureServerData = {
    name: '',
    description: '',
    colors: [],
    shops: [],
    category: undefined,
    proportions: {
      width: null,
      height: null,
      length: null
    }
  }
  colorsClientData: { color: string, imagesData: imageSliderData }[] = []
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
  checkValid() {
    const { name, colors, shops, category, proportions } = this.furnitureData
    const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
    if (
      name.length < 3 ||
      !category ||
      !FURNITURE_MODEL_BLOB ||
      shops.length < 0
    ) return false
    if (!proportions.height || !proportions.width || !proportions.length) return false
    colors.forEach(colorData => {
      return colorData.imagesData.images.length > 0
    })
    return true
  }
  createFurnitureCard() {
    if (!this.checkValid()) return

    const currentColorId = this.createFurnitureComponent.currentColorId
    if (currentColorId === undefined) return
    const furnitureData = this.createFurnitureComponent.furnitureData;
    const FURNITURE_TEXT_DATA = {
      name: furnitureData.name,
      description: furnitureData.description,
      colors: furnitureData.colors.map(colorObject => colorObject.color),
      shops: furnitureData.shops,
      proportions: furnitureData.proportions
    }
    let ADDITIONAL_DATA: additionalData | undefined = undefined
    if (
      furnitureData.category !== undefined
    ) {
      ADDITIONAL_DATA = {
        category: furnitureData.category
      }
    }

    const jwt = this.cookieService.getJwt()
    if (!jwt) return

    (() => {
      if (ADDITIONAL_DATA !== undefined) {
        return this.furnitureCardService.POSTcreateFurnitureCard(jwt, FURNITURE_TEXT_DATA, ADDITIONAL_DATA);
      } else {
        return this.furnitureCardService.POSTcreateFurnitureCard(jwt, FURNITURE_TEXT_DATA);
      }
    }
    )()
      .subscribe({
        next: (response) => {
          const FURNITURE_ID = (response as any).furnitureData._id

          furnitureData.colors.forEach(async colorData => {
            const { color, imagesData } = colorData
            if (imagesData.images.length === 0) return
            let imagesBlobArray: Blob[] = imagesData.images
            if (!(imagesData.images[0] instanceof Blob)) {
              imagesBlobArray = await this.transformUrlArrayToBlob(imagesData.images.map(blobUrl => blobUrl.toString()))
            }
            this.serverImageControl.POSTloadProjectImages(imagesBlobArray, jwt, FURNITURE_ID, color, imagesData.idMainImage)
              .subscribe({
                next: (response) => {
                  this.router.navigateByUrl('/account')
                },
                error: (error) => {
                  console.log(error)
                  this.errorHandler.setError('Error while uploading images', 5000)
                }
              })
          })

          const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
          this.furnitureModelService.POSTloadFurnitureModel(FURNITURE_MODEL_BLOB, jwt, FURNITURE_ID)
            .subscribe({
              next: (response) => {
              },
              error: (error) => {
                console.log(error)
                this.errorHandler.setError('Error while uploading model', 5000)
              }
            })
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while uploading furniture', 5000)
        }
      })
  }
  updateFurnitureCard() {
    const currentColorId = this.createFurnitureComponent.currentColorId
    if (currentColorId === undefined) return
    const furnitureData = this.createFurnitureComponent.furnitureData;
    const FURNITURE_TEXT_DATA = {
      name: furnitureData.name,
      description: furnitureData.description,
      colors: furnitureData.colors.map(colorObject => colorObject.color),
      shops: furnitureData.shops,
      proportions: furnitureData.proportions
    }
    let ADDITIONAL_DATA: additionalData | undefined = undefined
    if (
      furnitureData.category !== undefined
    ) {
      ADDITIONAL_DATA = {
        category: furnitureData.category
      }
    }
    const jwt = this.cookieService.getJwt()

    if (!jwt) return

    (() => {
      if (ADDITIONAL_DATA !== undefined) {
        return this.furnitureCardService.PUTupdateFurnitureCard(jwt, FURNITURE_TEXT_DATA, ADDITIONAL_DATA);
      } else {
        return this.furnitureCardService.PUTupdateFurnitureCard(jwt, FURNITURE_TEXT_DATA);
      }
    }
    )()
      .subscribe({
        next: (response) => {
          this.serverImageControl.DELETEproject(jwt, this.idPage)
            .subscribe({
              next: (response) => {
                furnitureData.colors.forEach(async colorData => {
                  const { color, imagesData } = colorData
                  let imagesBlobArray: Blob[] = imagesData.images
                  if (imagesData.images.length !== 0) {
                    if (!(imagesData.images[0] instanceof Blob)) {
                      imagesBlobArray = await this.transformUrlArrayToBlob(imagesData.images.map(blobUrl => blobUrl.toString()))
                    }
                    this.serverImageControl.POSTloadProjectImages(imagesBlobArray, jwt, this.idPage, color, imagesData.idMainImage)
                      .subscribe({
                        next: (response) => {
                          window.location.href = window.location.href
                        },
                        error: (error) => {
                          console.log(error)
                          this.errorHandler.setError('Error while updating images', 5000)
                        }
                      })
                  }

                  const FURNITURE_MODEL_BLOB = this.createFurnitureComponent.furnitureModelInput.files![0]
                  this.furnitureModelService.PUTupdateFurnitureModel(FURNITURE_MODEL_BLOB, jwt, this.idPage)
                    .subscribe({
                      next: (response) => {
                      },
                      error: (error) => {
                        console.log(error)
                        this.errorHandler.setError('Error while updating model', 5000)

                      }
                    })
                })
              },
              error: (error) => {
                console.log(error)
                this.errorHandler.setError('Error while updating images', 5000)
              }
            })
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while updating model', 5000)
        }
      })

  }
  clearFurnitureCard() {
    this.createFurnitureComponent.currentColorId = undefined
    this.furnitureData = {
      name: '',
      description: '',
      colors: [],
      shops: [],
      category: undefined,
      proportions: {
        width: 0,
        height: 0,
        length: 0
      }
    }
    this.colorsClientData = []
  }
  deleteFurnitureCard() {
    const jwt = this.cookieService.getJwt()
    if (!jwt) return
    this.serverImageControl.DELETEproject(jwt, this.idPage)
      .subscribe({
        next: (response) => {
          this.furnitureCardService.DELETEfurnitureCard(jwt, this.idPage)
            .subscribe({
              next: (response) => {
                this.router.navigateByUrl('/account')
              },
              error: (error) => {
                console.log(error)
                this.errorHandler.setError('Error while deleting furniture', 5000)
              }
            })
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while deleting images', 5000)
        }
      })

  }
  deleteColorCalculate() {
    if (!this.createFurnitureComponent || this.createFurnitureComponent.currentColorId === undefined) return
    return this.createFurnitureComponent.colorsClientData[this.createFurnitureComponent.currentColorId].color
  }
  deleteColor() {
    if (this.createFurnitureComponent.colorsClientData.length <= 1) return
    this.createFurnitureComponent.deleteColor()
  }
  getCurrentColorId() {
    if (!this.createFurnitureComponent) return
    return this.createFurnitureComponent.currentColorId
  }
}
