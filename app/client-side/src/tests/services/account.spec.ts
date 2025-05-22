import { inject, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams, provideHttpClient } from '@angular/common/http';
import { AccountService } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';

import {
  BASE_URL,
  JWT,
  ACCOUNT_DATA,
  ACCOUNT_RESPONSE,
  UPDATE_DATA,
  SUCCESS_RESPONSE,
} from './mock-data';

describe('AccountService ', () => {
  let cookieServiceMock: jasmine.SpyObj<AccountCookieService>;
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    cookieServiceMock = jasmine.createSpyObj('AccountCookieService', ['getJwt']);
    cookieServiceMock.getJwt.and.returnValue(JWT);

    TestBed.configureTestingModule({
      providers: [
        AccountService,
        { provide: AccountCookieService, useValue: cookieServiceMock },
        { provide: 'baseUrl', useValue: BASE_URL },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('HTTP requests', () => {
    it('should create email account with correct params', async () => {
      const promise = service.POSTcreateAccount(ACCOUNT_DATA);

      const req = httpMock.expectOne(`${BASE_URL}account`);
      expect(req.request.method).toBe('POST');
      assertParams(req.request.body as HttpParams, ACCOUNT_DATA);

      req.flush({ message: SUCCESS_RESPONSE });
      expect(await promise).toEqual({ message: SUCCESS_RESPONSE });
    });

    it('should delete jwt token with correct params', async () => {
      const promise = service.DELETEaccountJwt(JWT);

      const req = httpMock.expectOne(`${BASE_URL}account/jwt/delete?jwt=${JWT}`);
      expect(req.request.method).toBe('DELETE');

      req.flush({ message: SUCCESS_RESPONSE });
      expect(await promise).toEqual({ message: SUCCESS_RESPONSE });
    });

    it('should update account data with correct params', async () => {
      const promise = service.PUTupdateSecondaryAccountData(UPDATE_DATA);

      const req = httpMock.expectOne(request =>
        request.method === 'PUT' &&
        request.url === `${BASE_URL}account` &&
        request.params.get('nickname') === UPDATE_DATA.nickname &&
        request.params.has('jwt')
      );


      req.flush({ message: SUCCESS_RESPONSE });
      expect(await promise).toEqual({ message: SUCCESS_RESPONSE });
    });


    it('should delete account with correct params', async () => {
      const promise = service.DELETEaccount(JWT);

      const req = httpMock.expectOne(`${BASE_URL}account?jwt=${JWT}`);
      expect(req.request.method).toBe('DELETE');

      req.flush({ message: SUCCESS_RESPONSE });
      expect(await promise).toEqual({ message: SUCCESS_RESPONSE });
    });

    it('should get account data and transform furniture previewUrls', async () => {
      const promise = service.GETaccount(JWT);

      const req = httpMock.expectOne(`${BASE_URL}account?jwt=${JWT}`);
      expect(req.request.method).toBe('GET');

      req.flush(ACCOUNT_RESPONSE);

      const result = await promise;
      expect(result.accountData.furnitures[0].previewUrl).toBe(`${BASE_URL}previews/1.jpg`);
      expect(result.accountData.furnitures[1].previewUrl).toBe(`${BASE_URL}previews/2.jpg`);
    });

    it('should handle GETaccount errors gracefully', async () => {
      try {
        const promise = service.GETaccount(JWT);
        const req = httpMock.expectOne(`${BASE_URL}account?jwt=${JWT}`);
        req.error(new ProgressEvent('Network error'));
        await promise;
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('JWT checks', () => {
    it('should return true when jwt exists', () => {
      cookieServiceMock.getJwt.and.returnValue('exists');
      expect(service.checkJwt()).toBeTrue();
    });

    it('should return false when jwt does not exist', () => {
      cookieServiceMock.getJwt.and.returnValue(undefined as unknown as string);
      expect(service.checkJwt()).toBeFalse();
    });

  });

  function assertParams(params: HttpParams, expected: Record<string, any>) {
    Object.entries(expected).forEach(([key, value]) => {
      expect(params.get(key)).toBe(String(value));
    });
  }
});