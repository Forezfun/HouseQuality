import { inject, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpParams } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from '../../services/auth.service';
import {
  BASE_URL,
  EMAIL_AUTH_DATA,
  GOOGLE_AUTH_DATA,
  CHANGE_DATA_EMAIL,
  JWT_RESPONSE,
  CODE_RESPONSE,
  EMAIL,
  SUCCESS_RESPONSE
} from './mock-data';

describe('AuthService ', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const BASE = BASE_URL + 'auth/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('JWT creation', () => {
    it('should create long JWT for email account', async () => {
      const promise = service.POSTcreateLongJWT(EMAIL_AUTH_DATA);

      const req = httpMock.expectOne(BASE + 'jwt/long');
      expect(req.request.method).toBe('POST');

      assertParams(req.request.body as HttpParams, {
        accountType: 'email',
        email: EMAIL_AUTH_DATA.email,
        password: EMAIL_AUTH_DATA.password
      });

      req.flush(JWT_RESPONSE);
      expect(await promise).toEqual(JWT_RESPONSE);
    });

    it('should create long JWT for google account', async () => {
      const promise = service.POSTcreateLongJWT(GOOGLE_AUTH_DATA);

      const req = httpMock.expectOne(BASE + 'jwt/long');
      expect(req.request.method).toBe('POST');

      assertParams(req.request.body as HttpParams, {
        accountType: 'google'
      });

      req.flush(JWT_RESPONSE);
      expect(await promise).toEqual(JWT_RESPONSE);
    });

    it('should create short JWT by email', async () => {
      const promise = service.POSTcreateShortJWT(EMAIL);

      const req = httpMock.expectOne(BASE + 'jwt/temporary');
      expect(req.request.method).toBe('POST');

      assertParams(req.request.body as HttpParams, {
        email: EMAIL
      });

      req.flush(JWT_RESPONSE);
      expect(await promise).toEqual(JWT_RESPONSE);
    });
  });

  describe('Base data update', () => {
    it('should update base account data', async () => {
      const promise = service.PUTupdateBaseData(CHANGE_DATA_EMAIL);

      const req = httpMock.expectOne(BASE + 'account');
      expect(req.request.method).toBe('PUT');

      assertParams(req.request.body as HttpParams, {
        accountType: 'email',
        jwt: CHANGE_DATA_EMAIL.jwt,
        password: CHANGE_DATA_EMAIL.password
      });

      req.flush({message:SUCCESS_RESPONSE});
      expect(await promise).toEqual({message:SUCCESS_RESPONSE});
    });
  });

  describe('Password reset code', () => {
    it('should request password reset code', async () => {
      const promise = service.GETrequestPasswordCode(EMAIL);

      const req = httpMock.expectOne(`${BASE}account/code?email=${EMAIL}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('email')).toBe(EMAIL);

      req.flush(CODE_RESPONSE);
      expect(await promise).toEqual(CODE_RESPONSE);
    });
  });

  function assertParams(params: HttpParams, expected: Record<string, any>) {
    Object.entries(expected).forEach(([key, value]) => {
      expect(params.get(key)).toBe(String(value));
    });
  }
});
