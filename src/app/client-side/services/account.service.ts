import { Injectable } from '@angular/core';
import { projectInformation } from './project.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserCookieService } from './user-cookie.service';
export interface accountSignInData {
  email: string;
  password: string;
}
export interface accountChangeBaseData {
  email?: string;
  password: string;
}
export interface accountChangeSecondaryData {
  nickname: string;
}
export interface accountBaseInformation {
  nickname: string;
  email: string;
  password?: string;
}
export type userType = 'email' | 'google'
export interface accountFullInformation extends accountBaseInformation {
  projects: projectInformation[];
  avatarUrl: File|string
}
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(
    private httpModule: HttpClient,
    private userCookieService:UserCookieService
  ) { }
  private baseUrl = "http://localhost:8010/proxy/"
  POSTcreateUser(accountBaseData: accountBaseInformation, userType: userType) {
    let HTTP_PARAMS = new HttpParams()
      .set('userType', userType)
      .set('nickname', accountBaseData.nickname)
      .set('email', accountBaseData.email)
    console.log(userType === 'email')
    if (userType === 'email') HTTP_PARAMS = HTTP_PARAMS.set('password', accountBaseData.password!);
    console.log(HTTP_PARAMS)
    return this.httpModule.post(this.baseUrl + 'user/user/create', HTTP_PARAMS)
  }
  DELETEuserJwt(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
    return this.httpModule.delete(this.baseUrl + 'user/jwt/delete', {
      params: HTTP_PARAMS
    });
  }
  DELETEuser(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
    return this.httpModule.delete(this.baseUrl + 'user/user/delete', {
      params: HTTP_PARAMS
    })
  }
  GETuser(jwt: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
    return this.httpModule.get(this.baseUrl + 'user/user/get', {
      params: HTTP_PARAMS
    })
  }
  PUTupdateSecondaryInformation(jwt: string,changeData:accountChangeSecondaryData,userType:userType) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('userType',userType)
      .set('nickname',changeData.nickname)
    return this.httpModule.put(this.baseUrl + 'user/user/put', HTTP_PARAMS)
  }
  checkJwt():boolean{
    return this.userCookieService.getJwt()?true:false
  }
}
