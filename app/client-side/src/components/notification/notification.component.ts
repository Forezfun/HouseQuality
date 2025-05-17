import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AccountCookieService } from '../../services/account-cookie.service';
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [NgClass,NgIf],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent{
  constructor(
    private notificationService: NotificationService,
    private cookieService:AccountCookieService
  ){}
  
  protected errorMessage!:string
  protected successMessage!:string

  ngOnInit(): void {
    this.notificationService.error$.subscribe(message => {
      this.errorMessage = message;
    });
    this.notificationService.success$.subscribe(message => {
      this.successMessage = message;
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
