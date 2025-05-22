/**
 * Компонент страницы проектирования дома.
 * Позволяет просматривать, редактировать, сохранять и удалять проекты.
 * Подключает компонент `PlanHouseComponent` и использует данные пользователя и проектов.
 */

import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { PlanHouseComponent } from '../plan-house/plan-house.component';
import { Location, NgClass, NgFor, NgIf } from '@angular/common';
import { accountFullData, AccountService } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { projectServerInformation, ProjectService, roomData } from '../../services/project.service';
import { NotificationService } from '../../services/notification.service';
import { checkDesktop } from '../../usable/reusable-functions.used';

@Component({
  selector: 'app-plan-house-page',
  standalone: true,
  imports: [
    NavigationPanelComponent,
    PlanHouseComponent,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    NgIf,
    NgClass
  ],
  templateUrl: './plan-house-page.component.html',
  styleUrl: './plan-house-page.component.scss'
})
export class PlanHousePageComponent implements AfterViewInit, OnInit, AfterViewChecked {
  constructor(
    private accountService: AccountService,
    private accountCookieService: AccountCookieService,
    private router: Router,
    private route: ActivatedRoute,
    private elemenetRef: ElementRef,
    private renderer: Renderer2,
    private projectService: ProjectService,
    private notification: NotificationService,
    private location: Location
  ) {}

  /** Флаг, чтобы комната не открывалась повторно */
  private hasRoomIdBeenProcessed = false;

  /** DOM-элемент кнопки добавления проекта */
  private addModule!: HTMLSpanElement;

  /** Данные текущего плана комнат */
  private currentPlanHouse: roomData[] | undefined;

  /** Данные аккаунта пользователя с массивом проектов */
  protected accountData!: accountFullData & { projects: projectServerInformation[] };

  /** Индекс текущего выбранного проекта */
  protected currentProjectId: number | undefined = undefined;

  /** Ссылка на дочерний компонент планировки дома */
  @ViewChild('planHouse')
  private planHouse!: PlanHouseComponent;

  /**
   * Инициализация компонента.
   * Проверяет наличие JWT, при отсутствии — редирект на страницу логина.
   */
  ngOnInit(): void {
    const JWT = this.accountCookieService.getJwt();
    if (!JWT) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.pageInit(JWT);
  }

  /**
   * Получает DOM-элемент кнопки добавления проекта после инициализации view.
   */
  ngAfterViewInit(): void {
    this.addModule = this.elemenetRef.nativeElement.querySelector('.addModule');
  }

  /**
   * При загрузке проверяет наличие roomId и открывает комнату, если нужно.
   */
  ngAfterViewChecked(): void {
    if (this.hasRoomIdBeenProcessed || !this.planHouse || !this.route.snapshot.params['roomId']) return;
    const ROOM_ID = parseInt(this.route.snapshot.params['roomId']!);
    setTimeout(() => {
      if (typeof ROOM_ID === 'number') {
        this.planHouse.currentViewRoom = ROOM_ID;
        this.planHouse.currentIdClickedRoom = ROOM_ID;
        this.planHouse.openViewRoom(ROOM_ID);
        this.planHouse.sceneOpenToggle = true;
        this.planHouse.guideTemplate = this.planHouse.roomGuideTemplate;
        this.hasRoomIdBeenProcessed = true;
      }
    }, 0);
  }

  /**
   * Загружает данные аккаунта и инициализирует текущий проект по параметру в URL.
   * @param jwt JWT-токен из cookies
   */
  private async pageInit(jwt: string) {
    try {
      this.accountData = (await this.accountService.GETaccount(jwt)).accountData;

      this.route.paramMap.subscribe(params => {
        if (params.get('planId') === null) return;
        const PLAN_ID = parseInt(params.get('planId')!);
        if (this.accountData.projects.length >= PLAN_ID && PLAN_ID >= 0) {
          this.currentProjectId = PLAN_ID;
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Создает новый проект с именем из формы.
   */
  protected async createProject() {
    this.closeAddModule();
    const JWT = this.accountCookieService.getJwt();
    if (!this.projectNameForm.value || !this.projectNameForm.value.name || !JWT) return;
    try {
      const newProject = await this.projectService.POSTcreateProject(JWT, this.projectNameForm.value.name);
      this.accountData.projects = [...this.accountData.projects, newProject.projectData];
      this.notification.setSuccess('Проект создан', 5000);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Сохраняет текущий открытый проект на сервер.
   */
  protected async saveProject() {
    if (this.currentProjectId === undefined) return;

    const CURRENT_PROJECT_ID = this.accountData.projects[this.currentProjectId]._id;
    const ROOM_DATA = this.currentPlanHouse;
    if (ROOM_DATA === undefined) return;

    const JWT = this.accountCookieService.getJwt();
    if (!JWT) return;

    const PROJECT_DATA = {
      rooms: ROOM_DATA,
      name: this.accountData.projects[this.currentProjectId].name
    };

    try {
      await this.projectService.PUTupdateProject(JWT, CURRENT_PROJECT_ID, PROJECT_DATA);
      this.notification.setSuccess('Проект обновлен', 5000);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Удаляет указанный проект пользователя.
   * @param indexProject Индекс проекта в массиве
   */
  protected async deleteProject(indexProject: number) {
    const JWT = this.accountCookieService.getJwt();
    const CURRENT_PROJECT_ID = this.accountData.projects[indexProject]._id;
    if (!JWT || !CURRENT_PROJECT_ID) return;

    await this.projectService.DELETEdeleteProject(JWT, CURRENT_PROJECT_ID);
    this.notification.setSuccess('Проект удален', 5000);
    this.accountData.projects.splice(indexProject, 1);
  }

  /** Проверка, является ли текущее устройство десктопом */
  protected checkDesktop = checkDesktop;

  /**
   * Возвращает текущую выбранную комнату в планировке.
   */
  protected getCurrentViewRoom() {
    if (this.planHouse === undefined) return undefined;
    return this.planHouse.currentViewRoom;
  }

  /**
   * Обновляет локальные данные проекта при изменении планировки.
   * @param planHouse Новый массив данных комнат
   */
  protected updatePlanData(planHouse: roomData[]) {
    this.currentPlanHouse = planHouse;
    this.accountData.projects[this.currentProjectId!].rooms = planHouse;
  }

  /**
   * Закрывает модуль добавления проекта.
   */
  protected closeAddModule() {
    if (!this.addModule) return;
    this.renderer.addClass(this.addModule, 'disabled');
  }

  /**
   * Открывает модуль добавления проекта.
   */
  protected openAddModule() {
    if (!this.addModule) return;
    this.renderer.removeClass(this.addModule, 'disabled');
  }

  /**
   * Закрывает текущий проект и убирает `planId` из URL.
   */
  protected closeProject() {
    this.saveProject();
    this.currentProjectId = undefined;
    const NEW_URL = this.location.path().split('/').slice(0, -1).join('/');
    this.location.replaceState(NEW_URL);
  }

  /**
   * Открывает проект по его индексу и обновляет URL.
   * @param indexProject Индекс проекта в массиве
   */
  protected openProject(indexProject: number) {
    const NEW_URL = this.location.path() + '/' + indexProject;
    this.location.replaceState(NEW_URL);
    this.currentProjectId = indexProject;
  }

  /** Форма для ввода названия проекта */
  protected projectNameForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required])
  });
}
