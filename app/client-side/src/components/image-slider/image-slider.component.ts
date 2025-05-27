import { Component, HostListener, Input, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { TuiCarousel } from '@taiga-ui/kit';

/**
 * Интерфейс данных для слайдера с клиентскими изображениями в формате Blob.
 */
export interface imageSliderClientData {
  /** Массив изображений в формате Blob */
  images: Blob[];
  /** Индекс главного (выбранного) изображения */
  idMainImage: number;
}

/**
 * Интерфейс данных для слайдера с изображениями с сервера в виде URL-строк.
 */
export interface imageSliderFromServerData {
  /** Массив URL-строк изображений */
  images: string[];
  /** Индекс главного (выбранного) изображения */
  idMainImage: number;
}

/**
 * Компонент слайдера изображений.
 * Отображает изображения с возможностью выбора главного изображения.
 */
@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [NgIf, NgFor, TuiCarousel],
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.scss'
})
export class ImageSliderComponent implements OnInit {
  /**
   * Текущий индекс выбранного слайда (используется для локального отслеживания).
   */
  protected index: number = 0;

  /**
   * Флаг, указывающий, находится ли текущее отображение в мобильном виде (ширина <= 768px).
   */
  protected isMobileView: boolean = false;

  /**
   * Входные данные с изображениями с сервера.
   * Содержит массив URL и индекс главного изображения.
   */
  @Input()
  imagesData!: imageSliderFromServerData;

  /**
   * Входной параметр, который может менять режим слайдера (не используется явно в коде).
   */
  @Input()
  changeModeSlider: boolean = false;

  /**
   * Инициализация компонента.
   * Проверяет ширину экрана при загрузке.
   */
  ngOnInit(): void {
    this.checkViewport();
  }

  /**
   * Отслеживание изменения размера окна браузера.
   * Обновляет флаг isMobileView при изменении ширины окна.
   */
  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 768;
  }

  /**
   * Меняет индекс главного изображения (idMainImage) в данных.
   * @param index Индекс изображения, выбранного пользователем
   */
  protected changeMainImage(index: number) {
    this.imagesData.idMainImage = index;
  }

  /**
   * Возвращает количество элементов для отображения в слайдере.
   * Если изображений меньше 3 — возвращает длину массива,
   * иначе 1 для мобильного и 3 для десктопного вида.
   * @returns Количество видимых элементов слайдера
   */
  protected getItemsCount(): number {
    if (this.imagesData.images.length < 3) return 1;
    return this.isMobileView ? 1 : 3;
  }
}
