import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { userType } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class UserCookieService {
  constructor(
    private cookieService: CookieService
  ) { }

  /**
   * Установка JWT токена в куки
   * @param jwt JWT токен
   * @param typeJwt Тип JWT токена (долгосрочный или временный)
   */
  setJwt(jwt: string, typeJwt: 'long' | 'temporary') {
    const expirationDate = new Date();
    if (typeJwt === 'long') {
      expirationDate.setDate(expirationDate.getDate() + 7);
    } else {
      expirationDate.setMinutes(expirationDate.getMinutes() + 10);
    }
    this.cookieService.set('jwt', jwt, { expires: expirationDate, path: '/', sameSite: 'Strict' });
  }

  /**
   * Удаление JWT токена из куки
   */
  deleteJwt() {
    this.cookieService.delete('jwt', '/');
  }

  /**
   * Получение JWT токена из куки
   * @returns JWT токен, если он существует
   */
  getJwt() {
    return this.cookieService.get('jwt');
  }

  /**
   * Установка типа пользователя в куки
   * @param userType Тип пользователя (email или google)
   */
  setUserType(userType: userType) {
    this.cookieService.set('userType', userType, { expires: new Date().getDate() + 7, path: '/', sameSite: 'Strict' });
  }

  /**
   * Получение типа пользователя из куки
   * @returns Тип пользователя (email или google)
   */
  getUserType() {
    return this.cookieService.get('userType');
  }

  /**
   * Удаление типа пользователя из куки
   */
  deleteUserType() {
    this.cookieService.delete('userType');
  }
}
