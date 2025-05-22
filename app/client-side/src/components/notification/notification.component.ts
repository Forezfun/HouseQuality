import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AccountCookieService } from '../../services/account-cookie.service';

/**
 * Компонент отображения уведомлений об ошибках и успехах.
 * Также содержит методы выхода из аккаунта и перезагрузки страницы.
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit {
  constructor(
    private notificationService: NotificationService,
    private cookieService: AccountCookieService
  ) {}

  /** Сообщение об ошибке, получаемое из NotificationService */
  protected errorMessage!: string;

  /** Сообщение об успешном действии, получаемое из NotificationService */
  protected successMessage!: string;

  /**
   * Подписка на потоки сообщений при инициализации компонента.
   * Полученные сообщения сохраняются в соответствующие свойства.
   */
  ngOnInit(): void {
    this.notificationService.error$.subscribe(message => {
      this.errorMessage = message;
    });

    this.notificationService.success$.subscribe(message => {
      this.successMessage = message;
    });
  }

  /**
   * Перезагружает текущую страницу.
   */
  protected reloadPage(): void {
    window.location.reload();
  }

  /**
   * Удаляет JWT и тип аккаунта из cookie, затем перезагружает страницу.
   */
  protected logout(): void {
    this.cookieService.deleteJwt();
    this.cookieService.deleteAccountType();
    this.reloadPage();
  }
}
