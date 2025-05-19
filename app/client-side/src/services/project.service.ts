import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
import { modelInterface, objectSceneInterface } from '../components/scene/scene.component';
import { firstValueFrom } from 'rxjs';
import { reportResponse } from './report.service';
import { ReportService } from './report.service';


export interface roomData {
  name: string;
  gridArea: string;
  roomProportions: modelInterface;
  objects: objectSceneInterface[];
  _id?: string
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
  private baseServiceUrl = baseUrl + 'project/';
  constructor(
    private httpModule: HttpClient,
    private reportService:ReportService
  ) { }


  /**
   * Создание нового проекта
   * @param jwt JWT токен
   * @param name Название проекта
   * @returns Observable с результатом создания проекта
   */
  POSTcreateProject(jwt: string, name: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('name', name);
    return firstValueFrom(this.httpModule.post(this.baseServiceUrl, HTTP_PARAMS)) as Promise<{ projectData: projectServerInformation }>
  }

  /**
   * Удаление проекта
   * @param jwt JWT токен
   * @param projectId ID проекта
   * @returns Observable с результатом удаления проекта
   */
  DELETEdeleteProject(jwt: string, projectId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('projectId', projectId);
    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  /**
   * Получение проекта по ID
   * @param jwt JWT токен
   * @param projectId ID проекта
   * @returns Observable с данными проекта
   */
  GETgetProject(jwt: string, projectId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('projectId', projectId);
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{ projectData: projectServerInformation }>
  }

  /**
   * Обновление информации о проекте
   * @param jwt JWT токен
   * @param projectId ID проекта
   * @param projectInformation Новые данные проекта (название, комнаты и т.д.)
   * @returns Observable с результатом обновления проекта
   */
  PUTupdateProject(jwt: string, projectId: string, projectInformation: projectInformation) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('projectId', projectId)
    return firstValueFrom(this.httpModule.put(this.baseServiceUrl, projectInformation ,{ params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  async GETgetReportOfRoom(jwt: string, roomId: string, renderImage: Blob) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('roomId', roomId);
    let RESPONSE = await firstValueFrom(this.httpModule.get(this.baseServiceUrl + 'room', { params: HTTP_PARAMS })) as reportResponse
    RESPONSE.furnitures = RESPONSE.furnitures.map(furnitureData => {
      furnitureData.previewUrl = baseUrl + furnitureData.previewUrl
      return furnitureData
    })
    this.reportService.createReport(RESPONSE, renderImage)
  }
}

