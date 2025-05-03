import { Component, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, NgClass, NgFor, NgIf } from '@angular/common';
import { ShopService } from '../../services/shop.service';
import { ViewFurnitureComponent } from '../view-furniture/view-furniture.component';
import { accountFullInformation, AccountService } from '../../services/account.service';
import { UserCookieService } from '../../services/user-cookie.service';
import { projectInformation } from '../../services/project.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { category, CategoryService } from '../../services/category.service';
interface furnitureInShopData {
  name: string,
  cost: number,
  preview: string,
  id: string
}
@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ViewFurnitureComponent, RouterLink,NgClass,RouterLink],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent implements OnInit {
  furnitureId: undefined | string = undefined
  categoryName: undefined | string = undefined
  userProjects:projectInformation[] |undefined = undefined
  currentCategoryId:number|undefined
  furnituresArray: furnitureInShopData[] = []
  openAddModuleToggle:boolean=false
  categoryArray: category[] = []
  constructor(
    private route: ActivatedRoute,
    private shopService: ShopService,
    private router: Router,
    private userService:AccountService,
    private userCookieService:UserCookieService,
    private errorHandler:ErrorHandlerService,
    private categoryService:CategoryService,
    private location:Location
  ) { }
  openAddModule(){
    this.openAddModuleToggle=true
  }
  closeAddModule(){
    this.openAddModuleToggle=false
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
  initCategories(){
    this.categoryService.GETgetAllCategories()
    .subscribe({
      next:(value)=>{
        console.log(value)
        this.categoryArray=value.categoryArray
        this.categoryArray.forEach((categoryData,index)=>{
          if(this.categoryName===categoryData.name)this.currentCategoryId=index
        })
      },
      error:(error)=>{

      }
    })
  }
  furnituresInit() {
    if(this.furnitureId){
      const jwt =this.userCookieService.getJwt()
      this.userService.GETuser(jwt)
      .subscribe({
        next:(response)=>{
          this.userProjects=(((response as any).userData) as accountFullInformation).projects
        },
        error:(error)=>{
          console.log(error)
          this.errorHandler.setError('Error while receiving user', 5000)
        }
      })
    }else if (this.categoryName !== undefined) {
      this.requestCategoryFurnitures(this.categoryName,0)
    } else {
      this.requestAllFurnitures(0)
    }
    
  }
  requestCategoryFurnitures(categoryName:string,furnituresCount:number){
    this.shopService.GETgetCategoryData(categoryName, furnituresCount)
    .subscribe({
      next: (response) => {
        this.furnituresArray = this.transformToClientDataFurnitures((response as any).resultsArray)
      },
      error: (error) => {
        console.log(error)
        this.errorHandler.setError('Error while finding items', 5000)
      }
    })
  }
  requestAllFurnitures(furnituresCount:number){
    this.shopService.GETgetAllFurnitures(furnituresCount)
    .subscribe({
      next: (response) => {
        console.log(response)
        this.furnituresArray = this.transformToClientDataFurnitures((response as any).resultsArray)
      },
      error: (error) => {
        console.log(error)
        this.errorHandler.setError('Error while finding items', 5000)
      }
    })
  }
  getUrlForBlobImage(blob: Blob) {
    return URL.createObjectURL(blob)
  }
  private transformToClientDataFurnitures(furnituresArray: furnitureInShopData[]) {
    return furnituresArray.map((furnitureData: furnitureInShopData) => {
      return { ...furnitureData, preview: this.shopService.GETgetImageByPath(furnitureData.preview) }
    })
  }
  changeCategory(categoryIndex: number | undefined) {
    this.currentCategoryId=categoryIndex
    let newUrl = this.location.path()
    if(categoryIndex!==undefined){
      this.categoryName=this.categoryArray[categoryIndex].name
      newUrl+='/'+this.categoryArray[categoryIndex].name
    }else{
      this.categoryName=undefined
      newUrl='/shop'
    }
    this.location.replaceState(newUrl)
    this.furnituresInit()
  }
  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  closeFurniture(){
    this.router.navigateByUrl('/shop'+(this.categoryName==='all'?'':('/'+this.categoryName)))
  }
  getPlanUrl=(planId:number,roomId:number)=>`/plan/${planId}/${roomId}/${this.furnitureId}`
}
