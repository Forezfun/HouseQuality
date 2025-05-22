import { Directive, ElementRef, HostListener, inject, Input, OnInit } from '@angular/core';
import { throttle } from 'lodash';

@Directive({
  selector: '[appAutoHeight]',
  standalone: true
})
export class AutoHeightDirective implements OnInit {
  /**
   * Элемент, к которому привязана директива
   */
  private el = inject(ElementRef);
  
  /**
   * Флаг мобильного отображения.
   * Если true, включается автоизменение высоты текстового поля
   */
  @Input()
  mobileView: boolean = false;

  constructor() { }

  /**
   * Инициализация директивы
   * Добавляет слушатель события 'input' только если включён мобильный режим
   */
  ngOnInit(): void {
    if (!this.mobileView) return;
    this.el.nativeElement.addEventListener('input', this.onInput.bind(this.el.nativeElement));
  }
  
  /**
   * Обработчик события ввода текста в textarea
   * Автоматически регулирует высоту textarea под содержимое
   * Функция вызова ограничена (throttle) с задержкой 250 мс
   * @param event Событие ввода
   */
  onInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    throttle(() => {
      input.style.height = 'auto';
      input.style.height = (input.scrollHeight) + 'px';
    }, 250)();
  }
}
