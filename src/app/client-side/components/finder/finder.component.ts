import { NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';
import { FinderService } from '../../services/finder.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { RouterLink } from '@angular/router';
import { checkDesktop } from '../../mock-data/reusable-functions.used';
interface foundFurniture {
  name: string;
  cost: number;
  colorRequest: string;
  id:string;
  category:string;
}
@Component({
  selector: 'app-finder',
  standalone: true,
  imports: [NgClass,NgFor,NgIf,RouterLink],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.scss'
})
export class FinderComponent implements AfterViewInit{
  constructor(
    private finderService:FinderService,
    private elementRef:ElementRef,
    private renderer:Renderer2,
    private imageService:ServerImageControlService
  ){}

  private variantsSpan!:HTMLSpanElement
  private inputElement!:HTMLInputElement
  protected foundFurniture?: foundFurniture[]
  private debounceTimer: any = null;

  ngAfterViewInit(): void {
    this.variantsSpan=this.elementRef.nativeElement.querySelector('.variantsSpan') as HTMLSpanElement
    this.inputElement=this.elementRef.nativeElement.querySelector('.finderInput')
  }

  private async findFurnitures(findString:string){
    const RECEIVED_DATA = await this.finderService.GETfindFurnitures(findString) as foundFurniture[]
    this.openFoundResultsList()
    if(RECEIVED_DATA.length>0){
      this.closeFoundResultsList()
      setTimeout(()=>{this.foundFurniture=RECEIVED_DATA;this.openFoundResultsList()},400)
    }else{
      this.foundFurniture!==undefined?this.foundFurniture.length=0:this.foundFurniture=[]
    }
  }

  private openFoundResultsList(){
    if(this.variantsSpan===undefined)return
    this.renderer.addClass(this.variantsSpan,'variantsSpanOpen')
  }
  private closeFoundResultsList(){
    if(this.variantsSpan===undefined)return
    this.renderer.removeClass(this.variantsSpan,'variantsSpanOpen')
  }
protected checkDesktop=checkDesktop
  protected clearInput(){
    this.inputElement.value='';
    this.closeFoundResultsList()
  }
  protected inputProcess() {
    const VALUE = this.inputElement.value
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if(VALUE.length===0){
        this.closeFoundResultsList();
        return
      }
      this.findFurnitures(VALUE)
    }, 300);
  }
  protected getImage(idFurniture:string,color:string){
    return this.imageService.GETmainImage(idFurniture,color)
  }
  protected getUrl(idFurniture:string,category:string){
    return `shop/${category??'all'}/${idFurniture}`
  }
}
