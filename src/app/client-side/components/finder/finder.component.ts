import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';
import { FinderService } from '../../services/finder.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
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
  imports: [NgFor,NgIf],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.scss'
})
export class FinderComponent implements AfterViewInit{
  variantsSpan!:HTMLSpanElement
  constructor(
    private finderService:FinderService,
    private elementRef:ElementRef,
    private renderer:Renderer2,
    private imageService:ServerImageControlService
  ){}
  foundFurniture?: foundFurniture[]
  private debounceTimer: any = null;
  ngAfterViewInit(): void {
    this.variantsSpan=this.elementRef.nativeElement.querySelector('.variantsSpan') as HTMLSpanElement
  }
  inputProcess(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if(value.length===0){
        this.closeFoundResultsList();
        return
      }
      this.findFurnitures(value)
    }, 300);
  }
  async findFurnitures(findString:string){
    const receiveData = await this.finderService.GETfindFurnitures(findString) as foundFurniture[]
    this.openFoundResultsList()
    if(receiveData.length>0){
      this.closeFoundResultsList()
      setTimeout(()=>{this.foundFurniture=receiveData;this.openFoundResultsList()},550)
    }else{
      this.foundFurniture!==undefined?this.foundFurniture.length=0:this.foundFurniture=[]
    }
    console.log(receiveData)
  }
  openFoundResultsList(){
    if(this.variantsSpan==undefined)return
    this.renderer.addClass(this.variantsSpan,'variantsSpanOpen')
  }
  closeFoundResultsList(){
    if(this.variantsSpan==undefined)return
    this.renderer.removeClass(this.variantsSpan,'variantsSpanOpen')
  }
  getImage(idFurniture:string,color:string){
    return this.imageService.GETmainImage(idFurniture,color)
  }
  getUrl=(idFurniture:string,category:string)=>`shop/${category}/${idFurniture}`
}
