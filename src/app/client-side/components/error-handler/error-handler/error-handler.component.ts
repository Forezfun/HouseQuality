import { NgClass } from '@angular/common';
import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
@Component({
  selector: 'app-error-handler',
  standalone: true,
  imports: [NgClass],
  templateUrl: './error-handler.component.html',
  styleUrl: './error-handler.component.scss'
})
export class ErrorHandlerComponent{
  errorMessage:string=''
  constructor(
    private errorService: ErrorHandlerService
  ){}

  ngOnInit(): void {
    this.errorService.error$.subscribe(message => {
      this.errorMessage = message;
    });
  }
  reloadPage(){
    window.location.reload()
  }
}
