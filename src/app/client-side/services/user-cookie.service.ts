import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
@Injectable({
  providedIn: 'root'
})
export class UserCookieService {

  constructor(
    private cookieService: CookieService
  ) { }
  setJwt(jwt: string, typeJwt: 'long' | 'temporary') {
    const expirationDate = new Date();
    if (typeJwt === 'long') {
      expirationDate.setDate(expirationDate.getDate() + 7);
    } else {
      expirationDate.setMinutes(expirationDate.getMinutes() + 10);
    }
    this.cookieService.set('jwt', jwt, { expires: expirationDate, path: '/', sameSite: 'Strict' })
  }
  deleteJwt() {
    this.cookieService.delete('jwt', '/');
  }
  getJwt() {
    return this.cookieService.get('jwt')
  }
}
