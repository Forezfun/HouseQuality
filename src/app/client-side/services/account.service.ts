import { Injectable } from '@angular/core';
import { projectInformation } from './project.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserCookieService } from './user-cookie.service';
import { baseUrl } from '.';
export interface accountSignInData {
  email: string;
  password: string;
}
export interface accountChangeBaseData {
  password?: string;
}
export interface accountChangeSecondaryData {
  nickname: string;
}
export interface accountBaseInformation {
  nickname: string;
  email: string;
  password?: string;
}
export type userType = 'email' | 'google'
export interface accountFullInformation extends accountBaseInformation {
  projects: projectInformation[];
  avatarUrl: File|string
}
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(
    private httpModule: HttpClient,
    private userCookieService: UserCookieService
  ) { }

  /**
   * Создание нового пользователя
   * @param accountBaseData Основная информация о пользователе (никнейм, email, пароль)
   * @param userType Тип пользователя (email или google)
   * @returns Observable с результатом создания пользователя
   */
  POSTcreateUser(accountBaseData: accountBaseInformation, userType: userType) {
    let HTTP_PARAMS = new HttpParams()
      .set('userType', userType)
      .set('nickname', accountBaseData.nickname)
      .set('email', accountBaseData.email);

    if (userType === 'email') {
      HTTP_PARAMS = HTTP_PARAMS.set('password', accountBaseData.password!);
    }

    return this.httpModule.post(baseUrl + 'user/user/create', HTTP_PARAMS);
  }

  /**
   * Удаление JWT токена пользователя
   * @param jwt JWT токен пользователя
   * @returns Observable с результатом удаления токена
   */
  DELETEuserJwt(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return this.httpModule.delete(baseUrl + 'user/jwt/delete', { params: HTTP_PARAMS });
  }

  /**
   * Удаление пользователя
   * @param jwt JWT токен пользователя
   * @returns Observable с результатом удаления пользователя
   */
  DELETEuser(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return this.httpModule.delete(baseUrl + 'user/user/delete', { params: HTTP_PARAMS });
  }

  /**
   * Получение информации о пользователе
   * @param jwt JWT токен пользователя
   * @returns Observable с данными пользователя
   */
  GETuser(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return this.httpModule.get(baseUrl + 'user/user/get', { params: HTTP_PARAMS });
  }

  /**
   * Обновление дополнительной информации о пользователе (например, никнейм)
   * @param jwt JWT токен пользователя
   * @param changeData Новые данные для обновления
   * @param userType Тип пользователя (email или google)
   * @returns Observable с результатом обновления информации
   */
  PUTupdateSecondaryInformation(jwt: string, changeData: accountChangeSecondaryData, userType: userType) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('userType', userType)
      .set('nickname', changeData.nickname);
    return this.httpModule.put(baseUrl + 'user/user/put', HTTP_PARAMS);
  }

  /**
   * Проверка наличия JWT токена в куках
   * @returns boolean
   */
  checkJwt(): boolean {
    return this.userCookieService.getJwt() ? true : false;
  }
}
