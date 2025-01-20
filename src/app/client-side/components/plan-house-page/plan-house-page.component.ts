import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { PlanHouseComponent, roomData } from '../plan-house/plan-house.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
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
    private planHouseComponent: PlanHouseComponent,
    private errorHandler:ErrorHandlerService
  ) { }
  userData!: accountFullInformation
  currentProjectId: number | undefined = undefined
  addModule!: HTMLSpanElement
  @ViewChild('planHouse') planHouse!: PlanHouseComponent;
  currentPlanHouse: roomData[] | undefined
  projectNameForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required])
  })
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
        this.hasRoomIdBeenProcessed = true;
      }
    }, 0)
  }

  ngAfterViewInit(): void {
    this.addModule = this.elemenetRef.nativeElement.querySelector('.addModule')
  }
  deleteProject(indexProject: number) {
    const jwt = this.userCookieService.getJwt()
    const CURRENT_PROJECT_ID = (this.userData.projects[indexProject] as serverProjectInformation)._id
    if (!jwt || !CURRENT_PROJECT_ID) return
    this.projectService.DELETEdeleteProject(jwt, CURRENT_PROJECT_ID)
      .subscribe({
        next: (response) => {
          console.log(response)
          console.log(this.userData.projects)
          this.userData.projects.splice(indexProject, 1);
          console.log(this.userData.projects)
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while deleting project', 5000)
        }
      })
  }
  ngOnInit(): void {
    if (!this.userService.checkJwt()) this.router.navigateByUrl('/login')
    this.userService.GETuser(this.userCookieService.getJwt())
      .subscribe({
        next: (response) => {
          this.userData = (response as any).userData as accountFullInformation
          this.route.paramMap.subscribe(params => {
            if (params.get('planId') === null) return
            const planId = parseInt(params.get('planId')!) as number
            if (typeof (planId) === 'number' && this.userData.projects.length >= planId && planId >= 0) {
              this.currentProjectId = +planId
            }
            console.log(this.planHouseComponent.formElement)

          })
          console.log(this.userData)
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while receiving user', 5000)
        }
      })
  }
  updatePlanData(planHouse: roomData[]) {
    console.log(planHouse)
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
    console.log(this.currentProjectId)
    if (this.currentProjectId === undefined) return
    const CURRENT_PROJECT_ID = (this.userData.projects[this.currentProjectId] as serverProjectInformation)._id

    const ROOM_DATA = this.currentPlanHouse
    console.log(ROOM_DATA)
    if (ROOM_DATA === undefined) {
      return
    }
    console.log(ROOM_DATA)
    const jwt = this.userCookieService.getJwt()
    const PROJECT_DATA = {
      rooms: ROOM_DATA,
      name: this.userData.projects[this.currentProjectId].name
    }
    this.projectService.PUTupdateProject(jwt, CURRENT_PROJECT_ID, PROJECT_DATA)
      .subscribe({
        next: (response) => {
          console.log(response)
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while updating project', 5000)
        }
      })
  }
  closeProject(){
    this.saveProject()
    this.currentProjectId = undefined
  }
  openProject(indexProject: number) {
    this.router.navigateByUrl(this.router.url+'/'+indexProject)
    this.currentProjectId = indexProject
  }
  createProject() {
    this.closeAddModule()
    const jwt = this.userCookieService.getJwt()
    if (!this.projectNameForm.value || !this.projectNameForm.value.name || !jwt) return
    this.projectService.POSTcreateProject(jwt, this.projectNameForm.value.name)
      .subscribe({
        next: (response) => {
          console.log(response)
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
