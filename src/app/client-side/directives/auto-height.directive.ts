import { Directive, ElementRef, HostListener, inject, Input, OnInit } from '@angular/core';
import { throttle } from 'lodash';

@Directive({
  selector: '[appAutoHeight]',
  standalone: true
})
export class AutoHeightDirective implements OnInit {
  constructor() { }

  private el = inject(ElementRef)
  
  @Input()
  mobileView: boolean = false

  ngOnInit(): void {
    if (!this.mobileView) return
    this.el.nativeElement.addEventListener('input', this.onInput.bind(this.el.nativeElement));
  }
  
  onInput(event:Event) {
    const input = event.target as HTMLTextAreaElement
    throttle(() => {
      input.style.height = 'auto';
      input.style.height = (input.scrollHeight) + 'px';
    }, 250)()
  }
}
