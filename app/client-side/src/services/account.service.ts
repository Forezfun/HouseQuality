import { Injectable } from '@angular/core';
import { projectInformation, projectServerInformation } from './project.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AccountCookieService } from './account-cookie.service';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';

/**
 * Данные для изменения аккаунта с email
 */
export interface changeAccountDataEmail {
  /** JWT токен */
  jwt: string;
  /** Тип аккаунта (email) */
  accountType: 'email';
  /** Пароль пользователя */
  password: string;
}

/**
 * Полные данные аккаунта пользователя
 */
export interface accountFullData {
  /** URL аватара */
  avatarUrl: string;
  /** Никнейм пользователя */
  nickname: string;
  /** Email пользователя */
  email: string;
  /** Массив проектов пользователя */
  projects: projectInformation[];
  /** Массив мебели, связанной с аккаунтом */
  furnitures: furnitureAccountData[];
  /** Пароль пользователя (необязательный) */
  password?: string;
}

/**
 * Данные для изменения вторичных данных аккаунта
 */
export interface changeSecondaryData {
  /** JWT токен */
  jwt: string;
  /** Новый никнейм */
  nickname: string;
}

/**
 * Данные по мебели, связанной с аккаунтом
 */
export interface furnitureAccountData {
  /** Идентификатор мебели */
  _id: string;
  /** Название мебели */
  name: string;
  /** URL превью изображения мебели */
  previewUrl: string;
}

/** Тип аккаунта */
export type accountType = 'google' | 'email';

/** Тип данных для изменения аккаунта (на данный момент только email) */
export type changeAccountData = changeAccountDataEmail;

/**
 * Данные для создания аккаунта с email
 */
interface createEmailAccountData {
  /** Email */
  email: string;
  /** Пароль */
  password: string;
  /** Никнейм */
  nickname: string;
  /** Тип аккаунта (email) */
  accountType: 'email';
}

/** Тип данных для создания аккаунта */
export type createAccountData = createEmailAccountData;

/**
 * Функция-помощник для проверки, что аккаунт с типом email
 * @param account Объект аккаунта
 * @returns true, если аккаунт с типом email
 */
export function isEmailAccount(account: { accountType: accountType }): account is changeAccountDataEmail {
  return account.accountType === 'email';
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  /** Базовый URL для аккаунт-сервисов */
  private baseServiceUrl = baseUrl + 'account';

  constructor(
    private httpModule: HttpClient,
    private accountCookieService: AccountCookieService
  ) { }

  /**
   * Создание нового пользователя
   * @param createAccountData Основная информация о пользователе (никнейм, email, пароль)
   * @returns Promise с сообщением об успешном создании пользователя
   */
  POSTcreateAccount(createAccountData: createAccountData) {
    let HTTP_PARAMS = new HttpParams()
      .set('accountType', createAccountData.accountType)
      .set('nickname', createAccountData.nickname);

    if (isEmailAccount(createAccountData)) {
      HTTP_PARAMS = HTTP_PARAMS
        .set('email', createAccountData.email)
        .set('password', createAccountData.password);
    }

    return firstValueFrom(this.httpModule.post(this.baseServiceUrl, HTTP_PARAMS)) as Promise<{ message: string }>;
  }

  /**
   * Удаление JWT токена пользователя
   * @param jwt JWT токен
   * @returns Promise с сообщением об успешном удалении токена
   */
  DELETEaccountJwt(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt);
    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl + '/jwt/delete', { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Обновление вторичных данных аккаунта (например, никнейм)
   * @param changeData Данные для изменения
   * @returns Promise с сообщением об успешном обновлении
   */
  PUTupdateSecondaryAccountData(changeData: changeSecondaryData) {
    const HTTP_PARAMS = new HttpParams({
      fromObject: {
        nickname: changeData.nickname,
        jwt: changeData.jwt
      }
    });
    return firstValueFrom(this.httpModule.put(this.baseServiceUrl, null, { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Удаление аккаунта пользователя
   * @param jwt JWT токен
   * @returns Promise с сообщением об успешном удалении пользователя
   */
  DELETEaccount(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt);
    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Получение полной информации об аккаунте пользователя
   * @param jwt JWT токен
   * @returns Promise с данными аккаунта (включая проекты и мебель)
   */
  async GETaccount(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt);
    try {
      let { accountData } = await firstValueFrom(this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS })) as { accountData: accountFullData & { projects: projectServerInformation[] } };
      accountData.furnitures = accountData.furnitures.map(furnitureData => {
        return {
          ...furnitureData,
          previewUrl: baseUrl + furnitureData.previewUrl
        };
      });
      return { accountData: accountData };
    } catch (error) {
      console.error('Error in GETfurnitureCard:', error);
      throw error;
    }
  }

  /**
   * Проверка наличия JWT токена в куках
   * @returns true, если JWT токен найден, иначе false
   */
  checkJwt(): boolean {
    return this.accountCookieService.getJwt() ? true : false;
  }
}
