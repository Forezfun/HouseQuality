import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { accountType, changeAccountDataEmail,changeAccountData } from './account.service';
import { baseUrl } from '.';
import { isEmailAccount } from './account.service';
import { firstValueFrom } from 'rxjs';

export interface emailAuthData {
  email:string;
  password:string
  accountType:'email';
}
export interface googleAuthData {
  accountType:'google'
}
export type authData = googleAuthData|emailAuthData

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseServiceUrl = baseUrl+'auth/'
  constructor(
    private httpModule: HttpClient
  ) { }

  /**
   * Создание длинного JWT токена
   * @param signInData Данные для входа (email и пароль)
   * @param accountType Тип пользователя (email или google)
   * @return firstValueFrom(s Promise с результатом создания токена
   */
  POSTcreateLongJWT(authData: authData) {
    let HTTP_PARAMS = new HttpParams()
      .set('accountType', authData.accountType)
    if (isEmailAccount(authData)) {
      HTTP_PARAMS = HTTP_PARAMS
        .set('email', authData.email)
        .set('password', authData.password);
    }
    return firstValueFrom(this.httpModule.post(this.baseServiceUrl + 'jwt/long', HTTP_PARAMS)) as Promise<{ jwt: string }>
  }

  /**
   * Создание короткого JWT токена
   * @param signInData Данные для входа (email и пароль)
   * @return firstValueFrom(s Promise с результатом создания временного токена
   */
  POSTcreateShortJWT(email: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('email', email)
    return firstValueFrom(this.httpModule.post(this.baseServiceUrl + 'jwt/temporary', HTTP_PARAMS)) as Promise<{ jwt: string }>
  }

  /**
   * Обновление базовой информации о пользователе
   * @param jwt JWT токен пользователя
   * @param changeData Новые данные для обновления
   * @param typeJwt Тип JWT токена (короткий или длинный)
   * @param accountType Тип пользователя (email или google)
   * @return Promise с результатом обновления информации о пользователе
   */
  PUTupdateBaseData(changeData: changeAccountData) {
    let HTTP_PARAMS = new HttpParams()
      .set('accountType', changeData.accountType)
      .set('jwt', changeData.jwt)
    if (isEmailAccount(changeData)) {
      HTTP_PARAMS = HTTP_PARAMS
        .set('password', changeData.password);
    }
    return firstValueFrom(this.httpModule.put(this.baseServiceUrl + 'account', HTTP_PARAMS)) as Promise<{message:string}>
  }
  GETrequestPasswordCode(email: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('email', email);
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + 'account/code', { params: HTTP_PARAMS })) as Promise<{ resetCode: number }>
  }
}
