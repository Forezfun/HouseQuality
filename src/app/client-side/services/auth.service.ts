import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { accountSignInData, userType, accountChangeBaseData } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private httpModule: HttpClient
  ) { }

  private baseUrl = "http://localhost:8010/proxy/";

  /**
   * Создание длинного JWT токена
   * @param signInData Данные для входа (email и пароль)
   * @param userType Тип пользователя (email или google)
   * @returns Observable с результатом создания токена
   */
  POSTcreateLongJWT(signInData: accountSignInData, userType: userType) {
    let HTTP_PARAMS = new HttpParams()
      .set('userType', userType)
      .set('email', signInData.email)
      .set('password', signInData.password);
    return this.httpModule.post(this.baseUrl + 'auth/jwt/long/create', HTTP_PARAMS);
  }

  /**
   * Создание короткого JWT токена
   * @param signInData Данные для входа (email и пароль)
   * @returns Observable с результатом создания временного токена
   */
  POSTcreateShortJWT(signInData: accountSignInData) {
    let HTTP_PARAMS = new HttpParams()
      .set('email', signInData.email)
      .set('password', signInData.password);
    return this.httpModule.post(this.baseUrl + 'auth/jwt/temporary/create', HTTP_PARAMS);
  }

  /**
   * Обновление базовой информации о пользователе
   * @param jwt JWT токен пользователя
   * @param changeData Новые данные для обновления
   * @param typeJwt Тип JWT токена (короткий или длинный)
   * @param userType Тип пользователя (email или google)
   * @returns Observable с результатом обновления информации о пользователе
   */
  PUTupdateBaseData(jwt: string, changeData: accountChangeBaseData, typeJwt: 'short' | 'long', userType: userType) {
    let HTTP_PARAMS = new HttpParams()
      .set('typeJwt', typeJwt)
      .set('jwtToken', jwt)
      .set('userType', userType);

    if (userType === 'email' && changeData.password !== undefined) {
      HTTP_PARAMS = HTTP_PARAMS.set('password', changeData.password);
    }

    return this.httpModule.put(this.baseUrl + 'auth/user/update', HTTP_PARAMS);
  }
}
