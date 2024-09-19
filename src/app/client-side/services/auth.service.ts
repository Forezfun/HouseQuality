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
  private baseUrl = "http://localhost:8010/proxy/"
  POSTcreateLongJWT(signInData: accountSignInData, userType: userType) {
    let HTTP_PARAMS = new HttpParams()
      .set('userType', userType)
      .set('email', signInData.email)
      .set('password', signInData.password)
    // console.log(userType==='email')
    // if(userType==='email')HTTP_PARAMS = HTTP_PARAMS.set('password', accountBaseData.password!);
    console.log(HTTP_PARAMS)
    return this.httpModule.post(this.baseUrl + 'auth/jwt/long/create', HTTP_PARAMS)
  }
  POSTcreateShortJWT(signInData: accountSignInData) {
    let HTTP_PARAMS = new HttpParams()
      .set('email', signInData.email)
      .set('password', signInData.password)
    // console.log(userType==='email')
    // if(userType==='email')HTTP_PARAMS = HTTP_PARAMS.set('password', accountBaseData.password!);
    console.log(HTTP_PARAMS)
    return this.httpModule.post(this.baseUrl + 'auth/jwt/temporary/create', HTTP_PARAMS)
  }
  PUTupdateBaseData(jwt:string,changeData: accountChangeBaseData, typeJwt: 'short' | 'long',userType:userType) {
    let HTTP_PARAMS = new HttpParams()
      .set('password', changeData.password)
      .set('jwtToken', jwt)
      .set('userType', userType)
    if (typeJwt === 'long' && changeData.email !== undefined) HTTP_PARAMS = HTTP_PARAMS.set('email', changeData.email)
    console.log(HTTP_PARAMS)
    return this.httpModule.post(this.baseUrl + 'auth/user/update', HTTP_PARAMS)
  }
}
