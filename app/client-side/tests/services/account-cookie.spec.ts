import { AccountCookieService } from "../../src/app/services/account-cookie.service";
import { CookieService } from "ngx-cookie-service";
import { TestBed } from "@angular/core/testing";

describe('AccountCookieService ', () => {
  let service: AccountCookieService;
  let cookieServiceSpy: jasmine.SpyObj<CookieService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CookieService', [
      'set', 'get', 'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AccountCookieService,
        { provide: CookieService, useValue: spy }
      ]
    });

    service = TestBed.inject(AccountCookieService);
    cookieServiceSpy = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
  });

  describe('setJwt', () => {
    it('should set long JWT cookie with 7 days expiration', () => {
      const jwt = 'jwt-token';
      service.setJwt(jwt, 'long');

      expect(cookieServiceSpy.set).toHaveBeenCalledWith(
        'jwt',
        jwt,
        jasmine.objectContaining({ path: '/', sameSite: 'Strict' })
      );
    });

    it('should set temporary JWT cookie with 10 minutes expiration', () => {
      const jwt = 'jwt-token';
      service.setJwt(jwt, 'temporary');

      expect(cookieServiceSpy.set).toHaveBeenCalledWith(
        'jwt',
        jwt,
        jasmine.objectContaining({ path: '/', sameSite: 'Strict' })
      );
    });
  });

  it('should delete JWT cookie', () => {
    service.deleteJwt();
    expect(cookieServiceSpy.delete).toHaveBeenCalledWith('jwt', '/');
  });

  describe('guide rule methods', () => {
    it('should set guide rule cookie', () => {
      service.setGuideRule();
      expect(cookieServiceSpy.set).toHaveBeenCalledWith(
        'guideInclude',
        'false',
        jasmine.objectContaining({ path: '/', sameSite: 'Strict' })
      );
    });

    it('should get guide rule cookie', () => {
      cookieServiceSpy.get.and.returnValue('true');
      const result = service.getGuideRule();
      expect(result).toBe('true');
      expect(cookieServiceSpy.get).toHaveBeenCalledWith('guideInclude');
    });

    it('should delete guide rule cookie', () => {
      service.deleteGuideRule();
      expect(cookieServiceSpy.delete).toHaveBeenCalledWith('guideInclude', '/');
    });
  });

  describe('user type methods', () => {
    it('should set user type cookie', () => {
      service.setUserType('google');
      expect(cookieServiceSpy.set).toHaveBeenCalledWith(
        'accountType',
        'google',
        jasmine.objectContaining({ path: '/', sameSite: 'Strict' })
      );
    });

    it('should get user type cookie', () => {
      cookieServiceSpy.get.and.returnValue('email');
      const result = service.getUserType();
      expect(result).toBe('email');
      expect(cookieServiceSpy.get).toHaveBeenCalledWith('accountType');
    });

    it('should delete user type cookie', () => {
      service.deleteAccountType();
      expect(cookieServiceSpy.delete).toHaveBeenCalledWith('accountType');
    });
  });

  it('should get JWT cookie', () => {
    cookieServiceSpy.get.and.returnValue('token');
    const result = service.getJwt();
    expect(result).toBe('token');
    expect(cookieServiceSpy.get).toHaveBeenCalledWith('jwt');
  });
})