import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
import { modelInterface, objectSceneInterface } from '../components/scene/scene.component';
import { firstValueFrom } from 'rxjs';
export interface roomData {
  name: string;
  gridArea: string;
  roomProportions: modelInterface;
  objects: objectSceneInterface[]
}
export interface projectInformation {
  rooms: roomData[];
  name: string;
}
export interface projectServerInformation extends projectInformation {
  _id: string;
  authorId: String;
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
   * @param name Название проекта
   * @returns Observable с результатом создания проекта
   */
  POSTcreateProject(jwt: string, name: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('name', name);
    return firstValueFrom(this.httpModule.post(this.baseUrl, HTTP_PARAMS)) as Promise<{projectData:projectServerInformation}>
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
    return firstValueFrom(this.httpModule.delete(this.baseUrl, { params: HTTP_PARAMS })) as Promise<{message:string}>
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
    return firstValueFrom(this.httpModule.get(this.baseUrl, { params: HTTP_PARAMS })) as Promise<{projectData:projectServerInformation}>
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
    return firstValueFrom(this.httpModule.put(this.baseUrl, HTTP_PARAMS)) as Promise<{message:string}>
  }
}
