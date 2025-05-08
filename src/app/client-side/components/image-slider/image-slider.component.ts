import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import {TuiCarousel} from '@taiga-ui/kit';

export interface imageSliderData {
  images: String[];
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
  index:number = 0
  @Input()
  imagesData!: imageSliderData;
  @Input()
  changeModeSlider: boolean=false
  @Output()
  idMainImageEmitter =new EventEmitter<number>()
  isMobileView:boolean=false
  visibleId: number[] = [];
  ngOnInit(): void {
    this.checkViewport()
  }
  @HostListener('window:resize', ['$event'])
  checkViewport() {
    this.isMobileView = window.innerWidth <= 768;
  }
  changeMainImage(index:number) {
    this.imagesData.idMainImage=index
    this.idMainImageEmitter.emit(index)
  }
}
