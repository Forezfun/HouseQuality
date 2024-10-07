import { AfterViewInit, Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { PlanHouseComponent, roomData } from '../plan-house/plan-house/plan-house.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { accountFullInformation, AccountService } from '../../services/account.service';
import { UserCookieService } from '../../services/user-cookie.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService,serverProjectInformation } from '../../services/project.service';

@Component({
  selector: 'app-plan-house-page',
  standalone: true,
  imports: [NavigationPanelComponent, PlanHouseComponent, NgFor, NgIf, ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './plan-house-page.component.html',
  styleUrl: './plan-house-page.component.scss'
})
export class PlanHousePageComponent implements AfterViewInit, OnInit {
  constructor(
    private userService: AccountService,
    private userCookieService: UserCookieService,
    private router: Router,
    private elemenetRef: ElementRef,
    private renderer: Renderer2,
    private projectService: ProjectService,
    private planHouseComponent: PlanHouseComponent
  ) { }
  userData!: accountFullInformation
  currentProjectId: number | undefined = undefined
  addModule!: HTMLSpanElement
  currentPlanHouse: roomData[] | undefined
  projectNameForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required])
  })

  ngAfterViewInit(): void {
    this.addModule = this.elemenetRef.nativeElement.querySelector('.addModule')
  }
  deleteProject(indexProject: number) {
    const jwt = this.userCookieService.getJwt()
    const CURRENT_PROJECT_ID = (this.userData.projects[indexProject] as serverProjectInformation)._id
    if(!jwt||!CURRENT_PROJECT_ID)return
    this.projectService.DELETEdeleteProject(jwt,CURRENT_PROJECT_ID)
    .subscribe({
      next:(response)=>{
        console.log(response)
        console.log(this.userData.projects)
        this.userData.projects.splice(indexProject, 1);
        console.log(this.userData.projects)
      },
      error:(error)=>{
        console.log(error)
      }
    })
  }
  ngOnInit(): void {
    if (!this.userService.checkJwt()) this.router.navigateByUrl('/login')
    this.userService.GETuser(this.userCookieService.getJwt())
      .subscribe({
        next: (response) => {
          this.userData = (response as any).userData as accountFullInformation
          console.log(this.userData)
        },
        error: (error) => {
          console.log(error)
        }
      })
  }
  updatePlanData(planHouse: roomData[]) {
    console.log(planHouse)
    this.currentPlanHouse = planHouse
  }
  closeAddModule() {
    if (!this.addModule) return
    this.renderer.addClass(this.addModule, 'disabled')
  }
  openAddModule() {
    if (!this.addModule) return
    this.renderer.removeClass(this.addModule, 'disabled')
  }
  closeProject() {
    if (this.currentProjectId === undefined) return
    const CURRENT_PROJECT_ID = (this.userData.projects[this.currentProjectId] as serverProjectInformation)._id

    const ROOM_DATA = this.currentPlanHouse
    if (ROOM_DATA === undefined) return
    console.log(ROOM_DATA)
    const jwt = this.userCookieService.getJwt()
    const PROJECT_DATA = {
      rooms: ROOM_DATA,
      name: this.userData.projects[this.currentProjectId].name
    }
    this.currentProjectId = undefined
    this.projectService.PUTupdateProject(jwt, CURRENT_PROJECT_ID,PROJECT_DATA)
    .subscribe({
      next:(response)=>{
        console.log(response)
      },
      error:(error)=>{
        console.log(error)
      }
    })
  }
  openProject(indexProject: number) {
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
        }
      })

  }
}
