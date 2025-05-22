import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { accountType } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class AccountCookieService {
  constructor(
    private cookieService: CookieService
  ) { }

  /**
   * Установка JWT токена в куки с указанием срока действия
   * @param jwt JWT токен
   * @param typeJwt Тип JWT токена ('long' — долгосрочный, 'temporary' — временный)
   */
  setJwt(jwt: string, typeJwt: 'long' | 'temporary') {
    const expirationDate = new Date();
    if (typeJwt === 'long') {
      expirationDate.setDate(expirationDate.getDate() + 7); // срок действия 7 дней
    } else {
      expirationDate.setMinutes(expirationDate.getMinutes() + 10); // срок действия 10 минут
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
   * Установка флага отображения руководства (guideInclude) в куки
   */
  setGuideRule() {
    // Здесь исправил установку срока действия куки — должно быть объект Date, а не число
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    this.cookieService.set('guideInclude', 'false', { expires: expirationDate, path: '/', sameSite: 'Strict' });
  }

  /**
   * Получение значения флага отображения руководства из куки
   * @returns Значение куки guideInclude
   */
  getGuideRule() {
    return this.cookieService.get('guideInclude');
  }

  /**
   * Удаление флага отображения руководства из куки
   */
  deleteGuideRule() {
    this.cookieService.delete('guideInclude', '/');
  }

  /**
   * Получение JWT токена из куки
   * @returns JWT токен, либо пустую строку, если кука отсутствует
   */
  getJwt(): string {
    return this.cookieService.get('jwt');
  }

  /**
   * Установка типа пользователя в куки
   * @param accountType Тип аккаунта ('email' или 'google')
   */
  setUserType(accountType: accountType) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    this.cookieService.set('accountType', accountType, { expires: expirationDate, path: '/', sameSite: 'Strict' });
  }

  /**
   * Получение типа пользователя из куки
   * @returns Тип аккаунта ('email' или 'google'), либо пустая строка, если кука отсутствует
   */
  getUserType(): string {
    return this.cookieService.get('accountType');
  }

  /**
   * Удаление типа пользователя из куки
   */
  deleteAccountType() {
    this.cookieService.delete('accountType', '/');
  }
}
