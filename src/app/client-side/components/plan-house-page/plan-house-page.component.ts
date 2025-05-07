import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { PlanHouseComponent, roomData } from '../plan-house/plan-house.component';
import { Location, NgClass, NgFor, NgIf } from '@angular/common';
import { accountFullInformation, AccountService } from '../../services/account.service';
import { UserCookieService } from '../../services/user-cookie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService, serverProjectInformation } from '../../services/project.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-plan-house-page',
  standalone: true,
  imports: [NavigationPanelComponent, PlanHouseComponent, NgFor, NgIf, ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './plan-house-page.component.html',
  styleUrl: './plan-house-page.component.scss'
})
export class PlanHousePageComponent implements AfterViewInit, OnInit, AfterViewChecked {
  constructor(
    private userService: AccountService,
    private userCookieService: UserCookieService,
    private router: Router,
    private route: ActivatedRoute,
    private elemenetRef: ElementRef,
    private renderer: Renderer2,
    private projectService: ProjectService,
    private errorHandler: ErrorHandlerService,
    private location:Location
  ) { }

  userData!: accountFullInformation
  currentProjectId: number | undefined = undefined
  addModule!: HTMLSpanElement
  currentPlanHouse: roomData[] | undefined
  projectNameForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required])
  })
  checkDesktop(){
    return /windows nt|macintosh|x11|linux/.test(navigator.userAgent.toLowerCase())
  }
  @ViewChild('planHouse') planHouse!: PlanHouseComponent;
  private hasRoomIdBeenProcessed = false;
  ngAfterViewChecked(): void {
    if (this.hasRoomIdBeenProcessed || !this.planHouse || !this.route.snapshot.params['roomId']) return;
    const roomId = parseInt(this.route.snapshot.params['roomId']!) as number;
    setTimeout(() => {
      if (typeof roomId === 'number') {
        this.planHouse.currentViewRoom = roomId;
        this.planHouse.currentIdClickedRoom = roomId;

        this.planHouse.openViewRoom(roomId);
        this.planHouse.sceneOpenToggle = true;
        this.planHouse.guideTemplate=this.planHouse.roomGuideTemplate
        this.hasRoomIdBeenProcessed = true;
      }
    }, 0)
  }
  ngAfterViewInit(): void {
    this.addModule = this.elemenetRef.nativeElement.querySelector('.addModule')

  }
  getCurrentViewRoom(){
    if(this.planHouse===undefined)return undefined
    return this.planHouse.currentViewRoom
  }
  ngOnInit(): void {
    const jwt = this.userCookieService.getJwt()
    if (!jwt) {
      this.router.navigateByUrl('/login')
      return
    }
    this.pageInit(jwt)
  }
  pageInit(jwt: string) {
    this.userService.GETuser(jwt)
      .subscribe({
        next: (response) => {
          this.userData = (response as any).userData as accountFullInformation
          this.route.paramMap.subscribe(params => {
            if (params.get('planId') === null) return
            const planId = parseInt(params.get('planId')!)
            if (this.userData.projects.length >= planId && planId >= 0) {
              this.currentProjectId = planId
            }
          })
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while receiving user', 5000)
        }
      })
  }
  deleteProject(indexProject: number) {
    const jwt = this.userCookieService.getJwt()
    const CURRENT_PROJECT_ID = (this.userData.projects[indexProject] as serverProjectInformation)._id
    if (!jwt || !CURRENT_PROJECT_ID) return
    this.projectService.DELETEdeleteProject(jwt, CURRENT_PROJECT_ID)
      .subscribe({
        next: (response) => {
          this.userData.projects.splice(indexProject, 1);
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while deleting project', 5000)
        }
      })
  }
  updatePlanData(planHouse: roomData[]) {
    this.currentPlanHouse = planHouse
    this.userData.projects[this.currentProjectId!].rooms = planHouse
  }
  closeAddModule() {
    if (!this.addModule) return
    this.renderer.addClass(this.addModule, 'disabled')
  }
  openAddModule() {
    if (!this.addModule) return
    this.renderer.removeClass(this.addModule, 'disabled')
  }
  saveProject() {
    if (this.currentProjectId === undefined) return
    const CURRENT_PROJECT_ID = (this.userData.projects[this.currentProjectId] as serverProjectInformation)._id

    const ROOM_DATA = this.currentPlanHouse
    if (ROOM_DATA === undefined) {
      return
    }
    const jwt = this.userCookieService.getJwt()
    const PROJECT_DATA = {
      rooms: ROOM_DATA,
      name: this.userData.projects[this.currentProjectId].name
    }
    this.projectService.PUTupdateProject(jwt, CURRENT_PROJECT_ID, PROJECT_DATA)
      .subscribe({
        next: (response) => {
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while updating project', 5000)
        }
      })
  }
  closeProject() {
    this.saveProject()
    this.currentProjectId = undefined
    const newUrl = this.location.path().split('/').slice(0,-1).join('/')
    this.location.replaceState(newUrl)
  }
  openProject(indexProject: number) {
    const newUrl = this.location.path()+'/'+indexProject
    this.location.replaceState(newUrl)
    this.currentProjectId = indexProject
  }
  createProject() {
    this.closeAddModule()
    const jwt = this.userCookieService.getJwt()
    if (!this.projectNameForm.value || !this.projectNameForm.value.name || !jwt) return
    this.projectService.POSTcreateProject(jwt, this.projectNameForm.value.name)
      .subscribe({
        next: (response) => {
          this.userData.projects = [...this.userData.projects, {
            name: this.projectNameForm.value.name!,
            rooms: []
          }]
          this.projectNameForm.patchValue({
            name: ''
          })
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while creating project', 5000)
        }
      })
  }
  
}
