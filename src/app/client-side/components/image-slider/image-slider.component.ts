import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';

export interface imageSliderData {
  images: String[];
  idMainImage: number;
}

@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [NgIf, NgFor,NgClass],
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.scss'
})
export class ImageSliderComponent implements OnChanges {
  @Input()
  imagesArray!: imageSliderData;
  @Output()
  idMainImageEmitter =new EventEmitter<number>()
  visibleId: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imagesArray'] && this.imagesArray) {
      this.changeVisibleId(+this.imagesArray.idMainImage);
    }
  }

  changeImage(event: Event) {
    const newIdMainImage = +(event.target! as HTMLElement).getAttribute('data-id')!;
    this.changeVisibleId(newIdMainImage);
    this.idMainImageEmitter.emit(this.visibleId[0])
  }
  changeVisibleId(idMainImage: number) {
    this.visibleId = [idMainImage];
    this.visibleId.push(
      idMainImage === this.imagesArray.images.length - 1 ? 0 : idMainImage + 1
    );
    this.visibleId.push(
      idMainImage === 0 ? this.imagesArray.images.length - 1 : idMainImage - 1
    )
  }
}
