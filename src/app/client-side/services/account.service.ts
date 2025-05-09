import { Injectable } from '@angular/core';
import { projectInformation, projectServerInformation } from './project.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserCookieService } from './account-cookie.service';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
interface baseEmailAccountData {
  email: string;
  password: string;
}
interface changePasswordData {
  jwt: string;
  password: string;
}
export interface changeAccountDataEmail{
  jwt: string;
  accountType: 'email';
  password: string;
}
export interface accountFullData {
  avatarUrl:string;
  nickname:string;
  email: string;
  projects: projectInformation[];
  furnitures: furnitureAccountData[];
  password?:string
}
export interface changeSecondaryData{
  jwt:string;
  nickname:string;
}
export interface furnitureAccountData {
  furnitureId:string;
  name: string;
  previewUrl: string;
  firstColor:string;
}
type jwtType = 'long' | 'temporary';
export type accountType = 'google' | 'email';
export type changeAccountData = changeAccountDataEmail
interface createEmailAccountData {
  email:string;
  password:string;
  nickname:string;
  accountType:'email'
}
export type createAccountData = createEmailAccountData
export function isEmailAccount(account:{accountType:accountType}): account is changeAccountDataEmail {
  return account.accountType === 'email';
}
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = baseUrl+'user/' 
  constructor(
    private httpModule: HttpClient,
    private userCookieService: UserCookieService
  ) { }

  /**
   * Создание нового пользователя
   * @param accountBaseData Основная информация о пользователе (никнейм, email, пароль)
   * @param userType Тип пользователя (email или google)
   * @return firstValueFrom(s Promise с результатом создания пользователя
   */
  POSTcreateAccount(createAccountData: createAccountData) {
    let HTTP_PARAMS = new HttpParams()
      .set('userType', createAccountData.accountType)
      .set('nickname', createAccountData.nickname)
    if (isEmailAccount(createAccountData)) {
      HTTP_PARAMS = HTTP_PARAMS
        .set('email', createAccountData.email)
        .set('password', createAccountData.password);
    }

    return firstValueFrom(this.httpModule.post(baseUrl + 'user/create', HTTP_PARAMS)) as Promise<{message:string}>
  }

  /**
   * Удаление JWT токена пользователя
   * @param jwt JWT токен пользователя
   * @return firstValueFrom(s Promise с результатом удаления токена
   */
  DELETEaccountJwt(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return firstValueFrom(this.httpModule.delete(baseUrl + 'jwt/delete', { params: HTTP_PARAMS })) as Promise<{message:string}>
  }
  PUTupdateSecondaryAccountData(changeData: changeSecondaryData) {
    let HTTP_PARAMS = new HttpParams()
      .set('nickname', changeData.nickname);
    return firstValueFrom(this.httpModule.put(baseUrl + 'user/put', HTTP_PARAMS)) as Promise<{message:string}>
  }
  /**
   * Удаление пользователя
   * @param jwt JWT токен пользователя
   * @return firstValueFrom(s Promise с результатом удаления пользователя
   */
  DELETEaccount(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return firstValueFrom(this.httpModule.delete(baseUrl + 'user/delete', { params: HTTP_PARAMS })) as Promise<{message:string}>
  }

  /**
   * Получение информации о пользователе
   * @param jwt JWT токен пользователя
   * @return firstValueFrom(s Promise с данными пользователя
   */
  GETaccount(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return firstValueFrom(this.httpModule.get(baseUrl + 'user/get', { params: HTTP_PARAMS })) as Promise<{ accountData: accountFullData&{projects:projectServerInformation[]}}>
  }
  /**
   * Проверка наличия JWT токена в куках
   * @return firstValueFrom(s boolean
   */
  checkJwt(): boolean {
    return this.userCookieService.getJwt() ? true : false;
  }
}
