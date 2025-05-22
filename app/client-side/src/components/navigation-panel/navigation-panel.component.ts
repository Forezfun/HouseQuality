import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinderComponent } from '../finder/finder.component';
import { NgIf } from '@angular/common';

/**
 * Компонент навигационной панели.
 * Отображает меню навигации и компонент поиска.
 * Поддерживает адаптивность под мобильные устройства.
 */
@Component({
  selector: 'app-navigation-panel',
  standalone: true,
  imports: [RouterLink, FinderComponent, NgIf],
  templateUrl: './navigation-panel.component.html',
  styleUrl: './navigation-panel.component.scss'
})
export class NavigationPanelComponent implements OnInit {
  /** Состояние открытия выпадающего меню (используется на мобильных устройствах) */
  protected menuOpen = false;

  /** Флаг, указывающий, отображается ли компонент в мобильной версии */
  protected isMobileView = false;

  /**
   * Жизненный цикл OnInit.
   * Выполняет начальную проверку размера экрана.
   */
  ngOnInit() {
    this.checkViewport();
  }

  /**
   * Обработчик события изменения размера окна.
   * Проверяет ширину окна и обновляет флаг `isMobileView`.
   * Если устройство не мобильное — закрывает меню.
   * @param event Событие изменения размера окна
   */
  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView) {
      this.menuOpen = false; // Закрыть меню при переходе в десктопную версию
    }
  }

  /**
   * Переключает состояние меню (открыто/закрыто).
   */
  protected toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
