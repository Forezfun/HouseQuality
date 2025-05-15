import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { AccountCookieService } from '../../services/account-cookie.service';
@Component({
  selector: 'app-error-handler',
  standalone: true,
  imports: [NgClass],
  templateUrl: './error-handler.component.html',
  styleUrl: './error-handler.component.scss'
})
export class ErrorHandlerComponent{
  constructor(
    private errorService: ErrorHandlerService,
    private cookieService:AccountCookieService
  ){}
  
  protected errorMessage!:string

  ngOnInit(): void {
    this.errorService.error$.subscribe(message => {
      this.errorMessage = message;
    });
  }

  protected reloadPage(){
    window.location.reload()
  }
  protected logout(){
    this.cookieService.deleteJwt()
    this.cookieService.deleteAccountType()
    this.reloadPage()
  }
}
