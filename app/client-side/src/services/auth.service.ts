import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { accountType, changeAccountDataEmail, changeAccountData } from './account.service';
import { baseUrl } from '.';
import { isEmailAccount } from './account.service';
import { firstValueFrom } from 'rxjs';

/**
 * Данные для аутентификации через email
 */
export interface emailAuthData {
  /** Email пользователя */
  email: string;
  /** Пароль пользователя */
  password: string;
  /** Тип аккаунта - 'email' */
  accountType: 'email';
}

/**
 * Данные для аутентификации через Google
 */
export interface googleAuthData {
  /** Тип аккаунта - 'google' */
  accountType: 'google';
}

/**
 * Объединённый тип данных для аутентификации
 */
export type authData = googleAuthData | emailAuthData;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Базовый URL для auth-роутов */
  private baseServiceUrl = baseUrl + 'auth/';

  constructor(
    private httpModule: HttpClient
  ) { }

  /**
   * Создание длинного JWT токена
   * @param authData Данные для входа (email+пароль или google)
   * @returns Promise с JWT токеном
   */
  POSTcreateLongJWT(authData: authData) {
    let HTTP_PARAMS = new HttpParams()
      .set('accountType', authData.accountType);

    if (isEmailAccount(authData)) {
      HTTP_PARAMS = HTTP_PARAMS
        .set('email', authData.email)
        .set('password', authData.password);
    }

    return firstValueFrom(this.httpModule.post(this.baseServiceUrl + 'jwt/long', HTTP_PARAMS)) as Promise<{ jwt: string }>;
  }

  /**
   * Создание короткого (временного) JWT токена
   * @param email Email пользователя
   * @returns Promise с временным JWT токеном
   */
  POSTcreateShortJWT(email: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('email', email);

    return firstValueFrom(this.httpModule.post(this.baseServiceUrl + 'jwt/temporary',null, { params: HTTP_PARAMS })) as Promise<{ jwt: string }>;
  }

  /**
   * Обновление базовой информации о пользователе
   * @param changeData Новые данные для обновления аккаунта
   * @returns Promise с сообщением об успехе обновления
   */
  PUTupdateBaseData(changeData: changeAccountData) {
    const paramObject: any = {
      accountType: changeData.accountType,
      jwt: changeData.jwt
    };

    if (isEmailAccount(changeData)) {
      paramObject.password = changeData.password;
    }

    const HTTP_PARAMS = new HttpParams({ fromObject: paramObject });
    console.log(HTTP_PARAMS.toString());

    return firstValueFrom(this.httpModule.put(this.baseServiceUrl + 'account', changeData)) as Promise<{ message: string }>;
  }

  /**
   * Запрос кода сброса пароля по email
   * @param email Email пользователя
   * @returns Promise с кодом для сброса пароля
   */
  GETrequestPasswordCode(email: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('email', email);

    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + 'account/code', { params: HTTP_PARAMS })) as Promise<{ resetCode: number }>;
  }
}
