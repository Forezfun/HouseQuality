import { Component, HostListener, Input, OnInit} from '@angular/core';
import { NgIf, NgFor} from '@angular/common';
import {TuiCarousel} from '@taiga-ui/kit';

export interface imageSliderClientData {
  images: Blob[];
  idMainImage: number;
}
export interface imageSliderFromServerData {
  images: string[];
  idMainImage: number;
}

@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [NgIf, NgFor,TuiCarousel],
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.scss'
})
export class ImageSliderComponent implements OnInit{
  protected index:number = 0
  protected isMobileView:boolean=false

  @Input()
  imagesData!: imageSliderFromServerData;
  @Input()
  changeModeSlider: boolean=false

  ngOnInit(): void {
    this.checkViewport()
  }

  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 768;
  }
  protected changeMainImage(index:number) {
    this.imagesData.idMainImage=index
  }
  protected getItemsCount(){
    if(this.imagesData.images.length<3)return this.imagesData.images.length
    return this.isMobileView?1:3
  }
}
