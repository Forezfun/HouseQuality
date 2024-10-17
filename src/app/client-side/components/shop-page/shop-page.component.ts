import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { furnitureServerData } from '../create-furnitre/create-furniture.component';
import { NgFor, NgIf } from '@angular/common';
import { ShopService } from '../../services/shop.service';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
interface furnitureInShopData {
  name: string,
  cost: number,
  preview: string,
  id: string
}

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ViewFurnitureComponent, RouterLink],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent implements OnInit {
  furnitureId: undefined | string = undefined
  categoryName: undefined | string = undefined
  currentPath!: string;
  furnituresArray: furnitureInShopData[] = []
  furnitureCategoryDataArray: string[] = [
    'Chair', 'Lamp', 'Sofa', 'Table'
  ]
  constructor(
    private route: ActivatedRoute,
    private shopService: ShopService,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.currentPath = this.route.snapshot.url.join('/');
      console.log(this.currentPath)
      console.log(params)
      this.furnitureId = params['furnitureId']
      this.categoryName = params['category']
      if (this.categoryName !== undefined) {
        this.shopService.GETgetCategoryData(this.categoryName, this.furnituresArray.length)
          .subscribe({
            next: (response) => {
              console.log(response)
              this.furnituresArray = this.transformToClientDataFurnitures((response as any).resultsArray)
            },
            error: (error) => {
              console.log(error)
            }
          })
      } else {
        this.shopService.GETgetAllFurnitures(this.furnituresArray.length)
          .subscribe({
            next: (response) => {
              console.log(response)
              this.furnituresArray = this.transformToClientDataFurnitures((response as any).resultsArray)
            },
            error: (error) => {
              console.log(error)
            }
          })
      }
    })
  }
  getUrlForBlobImage(blob: Blob) {
    return URL.createObjectURL(blob)
  }
  private transformToClientDataFurnitures(furnituresArray: furnitureInShopData[]) {
    return furnituresArray.map((furnitureData: furnitureInShopData) => {
      console.log(this.shopService.GETgetImageByPath(furnitureData.preview))
      return { ...furnitureData, preview: this.shopService.GETgetImageByPath(furnitureData.preview) }
    })
  }
  changeCategory(categoryIndex: number | null) {
    this.router.navigateByUrl('/shop' + (categoryIndex !== null ? '/' + this.furnitureCategoryDataArray[categoryIndex].toLocaleLowerCase() : ''))
  }
  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  closeFurniture(){
    this.router.navigateByUrl('/shop'+(this.categoryName==='all'?'':('/'+this.categoryName)))
  }
}
