import { Injectable } from '@angular/core';
import { roomData } from '../components/plan-house/plan-house.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
export interface projectInformation {
  rooms: roomData[];
  name: string;
}
export interface serverProjectInformation extends projectInformation {
  _id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(
    private httpModule: HttpClient
  ) {}

  private baseUrl = baseUrl+"projects/";

  /**
   * Создание нового проекта
   * @param jwt JWT токен пользователя
   * @param nameProject Название проекта
   * @returns Observable с результатом создания проекта
   */
  POSTcreateProject(jwt: string, nameProject: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('nameProject', nameProject);
    return this.httpModule.post(this.baseUrl, HTTP_PARAMS);
  }

  /**
   * Удаление проекта
   * @param jwt JWT токен пользователя
   * @param projectId ID проекта
   * @returns Observable с результатом удаления проекта
   */
  DELETEdeleteProject(jwt: string, projectId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('projectId', projectId);
    return this.httpModule.delete(this.baseUrl, { params: HTTP_PARAMS });
  }

  /**
   * Получение проекта по ID
   * @param jwt JWT токен пользователя
   * @param projectId ID проекта
   * @returns Observable с данными проекта
   */
  GETgetProject(jwt: string, projectId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('projectId', projectId);
    return this.httpModule.get(this.baseUrl, { params: HTTP_PARAMS });
  }

  /**
   * Обновление информации о проекте
   * @param jwt JWT токен пользователя
   * @param projectId ID проекта
   * @param projectInformation Новые данные проекта (название, комнаты и т.д.)
   * @returns Observable с результатом обновления проекта
   */
  PUTupdateProject(jwt: string, projectId: string, projectInformation: projectInformation) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('projectId', projectId)
      .set('nameProject', projectInformation.name)
      .set('rooms', JSON.stringify(projectInformation.rooms));
    return this.httpModule.put(this.baseUrl, HTTP_PARAMS);
  }
}
