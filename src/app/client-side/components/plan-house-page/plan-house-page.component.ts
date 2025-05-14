import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { PlanHouseComponent } from '../plan-house/plan-house.component';
import { Location, NgClass, NgFor, NgIf } from '@angular/common';
import { accountFullData, AccountService } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { projectServerInformation, ProjectService, roomData } from '../../services/project.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { checkDesktop } from '../../usable/reusable-functions.used';

@Component({
  selector: 'app-plan-house-page',
  standalone: true,
  imports: [NavigationPanelComponent, PlanHouseComponent, NgFor, NgIf, ReactiveFormsModule, NgIf, NgClass],
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
    private errorHandler: ErrorHandlerService,
    private location: Location
  ) { }

  private hasRoomIdBeenProcessed = false;
  private addModule!: HTMLSpanElement
  private currentPlanHouse: roomData[] | undefined
  protected accountData!: accountFullData & { projects: projectServerInformation[] }
  protected currentProjectId: number | undefined = undefined

  @ViewChild('planHouse')
  private planHouse!: PlanHouseComponent;

  ngOnInit(): void {
    const JWT = this.accountCookieService.getJwt()
    if (!JWT) {
      this.router.navigateByUrl('/login')
      return
    }
    this.pageInit(JWT)
  }
  ngAfterViewInit(): void {
    this.addModule = this.elemenetRef.nativeElement.querySelector('.addModule')
  }
  ngAfterViewChecked(): void {
    if (this.hasRoomIdBeenProcessed || !this.planHouse || !this.route.snapshot.params['roomId']) return;
    const ROOM_ID = parseInt(this.route.snapshot.params['roomId']!) as number;
    setTimeout(() => {
      if (typeof ROOM_ID === 'number') {
        this.planHouse.currentViewRoom = ROOM_ID;
        this.planHouse.currentIdClickedRoom = ROOM_ID;

        this.planHouse.openViewRoom(ROOM_ID);
        this.planHouse.sceneOpenToggle = true;
        this.planHouse.guideTemplate = this.planHouse.roomGuideTemplate
        this.hasRoomIdBeenProcessed = true;
      }
    }, 0)
  }

  private async pageInit(jwt: string) {
    try {
      this.accountData = (await this.accountService.GETaccount(jwt)).accountData
      console.log(this.accountData)

      this.route.paramMap.subscribe(params => {
        if (params.get('planId') === null) return
        const PLAN_ID = parseInt(params.get('planId')!)
        if (this.accountData.projects.length >= PLAN_ID && PLAN_ID >= 0) {
          this.currentProjectId = PLAN_ID
        }
      })
    } catch (error) {
      console.log(error)
    }
  }
  protected async createProject() {
    this.closeAddModule()
    const JWT = this.accountCookieService.getJwt()
    if (!this.projectNameForm.value || !this.projectNameForm.value.name || !JWT) return
    try {
      this.accountData.projects = [...this.accountData.projects, (await this.projectService.POSTcreateProject(JWT, this.projectNameForm.value.name)).projectData]
    } catch (error) {
      console.log(error)
    }
  }
  protected async saveProject() {
    if (this.currentProjectId === undefined) return
    const CURRENT_PROJECT_ID = this.accountData.projects[this.currentProjectId]._id

    const ROOM_DATA = this.currentPlanHouse
    if (ROOM_DATA === undefined) {
      return
    }
    const JWT = this.accountCookieService.getJwt()
    if(!JWT)return
    const PROJECT_DATA = {
      rooms: ROOM_DATA,
      name: this.accountData.projects[this.currentProjectId].name
    }
    try {
      await this.projectService.PUTupdateProject(JWT, CURRENT_PROJECT_ID, PROJECT_DATA)
    } catch (error) {
      console.log(error)
    }
  }
  protected async deleteProject(indexProject: number) {
    const JWT = this.accountCookieService.getJwt()
    const CURRENT_PROJECT_ID = this.accountData.projects[indexProject]._id
    if (!JWT || !CURRENT_PROJECT_ID) return

    await this.projectService.DELETEdeleteProject(JWT, CURRENT_PROJECT_ID)
    this.accountData.projects.splice(indexProject, 1);
  }


protected checkDesktop=checkDesktop
  protected getCurrentViewRoom() {
    if (this.planHouse === undefined) return undefined
    return this.planHouse.currentViewRoom
  }
  protected updatePlanData(planHouse: roomData[]) {
    this.currentPlanHouse = planHouse
    this.accountData.projects[this.currentProjectId!].rooms = planHouse
  }
  protected closeAddModule() {
    if (!this.addModule) return
    this.renderer.addClass(this.addModule, 'disabled')
  }
  protected openAddModule() {
    if (!this.addModule) return
    this.renderer.removeClass(this.addModule, 'disabled')
  }
  protected closeProject() {
    this.saveProject()
    this.currentProjectId = undefined
    const NEW_URL = this.location.path().split('/').slice(0, -1).join('/')
    this.location.replaceState(NEW_URL)
  }
  protected openProject(indexProject: number) {
    const NEW_URL = this.location.path() + '/' + indexProject
    this.location.replaceState(NEW_URL)
    this.currentProjectId = indexProject
  }

  protected projectNameForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required])
  })
}
