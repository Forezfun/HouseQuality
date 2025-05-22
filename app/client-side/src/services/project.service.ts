import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
import { modelInterface, objectSceneInterface } from '../components/scene/scene.component';
import { firstValueFrom } from 'rxjs';
import { reportResponse } from './report.service';
import { ReportService } from './report.service';

/**
 * Интерфейс описания комнаты
 */
export interface roomData {
  /** Название комнаты */
  name: string;
  /** Сетка размещения (например, '1 / 2 / 3 / 4') */
  gridArea: string;
  /** Пропорции комнаты (ширина, высота, глубина) */
  roomProportions: modelInterface;
  /** Список объектов, размещённых в комнате */
  objects: objectSceneInterface[];
  /** (Необязательно) ID комнаты */
  _id?: string;
}

/**
 * Интерфейс информации о проекте
 */
export interface projectInformation {
  /** Название проекта */
  name: string;
  /** Список комнат в проекте */
  rooms: roomData[];
}

/**
 * Интерфейс информации о проекте, получаемой с сервера
 */
export interface projectServerInformation extends projectInformation {
  /** ID проекта */
  _id: string;
  /** ID автора проекта */
  authorId: string;
}

/**
 * Сервис для управления проектами: создание, удаление, получение, обновление и генерация отчетов
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  /** Базовый URL для API запросов к проектам */
  private baseServiceUrl = baseUrl + 'project';

  constructor(
    private httpModule: HttpClient,
    private reportService: ReportService
  ) {}

  /**
   * Создание нового проекта
   * @param jwt JWT токен для авторизации
   * @param name Название проекта
   * @returns Промис с объектом, содержащим данные проекта
   */
  POSTcreateProject(jwt: string, name: string): Promise<{ projectData: projectServerInformation }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('name', name);
    return firstValueFrom(this.httpModule.post(this.baseServiceUrl, HTTP_PARAMS)) as Promise<{ projectData: projectServerInformation }>;
  }

  /**
   * Удаление проекта
   * @param jwt JWT токен для авторизации
   * @param projectId ID проекта, который нужно удалить
   * @returns Промис с сообщением об удалении
   */
  DELETEdeleteProject(jwt: string, projectId: string): Promise<{ message: string }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('projectId', projectId);
    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Получение проекта по ID
   * @param jwt JWT токен для авторизации
   * @param projectId ID проекта, который нужно получить
   * @returns Промис с данными проекта
   */
  GETgetProject(jwt: string, projectId: string): Promise<{ projectData: projectServerInformation }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('projectId', projectId);
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{ projectData: projectServerInformation }>;
  }

  /**
   * Обновление данных проекта
   * @param jwt JWT токен для авторизации
   * @param projectId ID проекта, который нужно обновить
   * @param projectInformation Новые данные проекта
   * @returns Промис с сообщением об успешном обновлении
   */
  PUTupdateProject(jwt: string, projectId: string, projectInformation: projectInformation): Promise<{ message: string }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('projectId', projectId);
    return firstValueFrom(this.httpModule.put(this.baseServiceUrl, projectInformation, { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Получение отчета о комнате и генерация PDF отчета
   * @param jwt JWT токен для авторизации
   * @param roomId ID комнаты, по которой нужно получить отчет
   * @param renderImage Изображение рендера комнаты в формате Blob
   * @returns Промис, завершающийся после создания отчета
   */
  async GETgetReportOfRoom(jwt: string, roomId: string, renderImage: Blob): Promise<void> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('roomId', roomId);

    const RESPONSE = await firstValueFrom(this.httpModule.get(this.baseServiceUrl + '/room', { params: HTTP_PARAMS })) as reportResponse;

    RESPONSE.furnitures = RESPONSE.furnitures.map(furnitureData => {
      furnitureData.previewUrl = baseUrl + furnitureData.previewUrl;
      return furnitureData;
    });

    this.reportService.createReport(RESPONSE, renderImage);
  }
}
