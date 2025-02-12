import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { UserCookieService } from '../../services/user-cookie.service';
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
    private cookieService:UserCookieService
  ){}
  
  errorMessage!:string

  ngOnInit(): void {
    this.errorService.error$.subscribe(message => {
      this.errorMessage = message;
    });
  }
  reloadPage(){
    window.location.reload()
  }
  logout(){
    this.cookieService.deleteJwt()
    this.cookieService.deleteUserType()
    this.reloadPage()
  }
}
