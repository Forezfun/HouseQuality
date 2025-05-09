import { NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';
import { FinderService } from '../../services/finder.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { RouterLink } from '@angular/router';
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

  variantsSpan!:HTMLSpanElement
  input!:HTMLInputElement
  foundFurniture?: foundFurniture[]
  private debounceTimer: any = null;
  checkDesktop(){
    return /windows nt|macintosh|x11|linux/.test(navigator.userAgent.toLowerCase())
  }
  ngAfterViewInit(): void {
    this.variantsSpan=this.elementRef.nativeElement.querySelector('.variantsSpan') as HTMLSpanElement
    this.input=this.elementRef.nativeElement.querySelector('.finderInput')
  }

  private async findFurnitures(findString:string){
    const receiveData = await this.finderService.GETfindFurnitures(findString) as foundFurniture[]
    this.openFoundResultsList()
    if(receiveData.length>0){
      this.closeFoundResultsList()
      setTimeout(()=>{this.foundFurniture=receiveData;this.openFoundResultsList()},400)
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

  clearInput(){
    this.input.value='';
    this.closeFoundResultsList()
  }
  inputProcess() {
    const value = this.input.value
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if(value.length===0){
        this.closeFoundResultsList();
        return
      }
      this.findFurnitures(value)
    }, 300);
  }
  getImage(idFurniture:string,color:string){
    return this.imageService.GETmainImage(idFurniture,color)
  }
  getUrl=(idFurniture:string,category:string)=>`shop/${category}/${idFurniture}`
}
