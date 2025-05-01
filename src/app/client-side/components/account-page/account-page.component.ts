import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { accountChangeBaseData, accountChangeSecondaryData, accountFullInformation, AccountService, userType } from '../../services/account.service';
import { FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserCookieService } from '../../services/user-cookie.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ReactiveFormsModule, CommonModule,RouterLink],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss'
})
export class AccountPageComponent implements AfterViewInit, OnInit {
  private addModule!: HTMLDivElement;
  userData?: accountFullInformation&{furnitureCards:any}
  constructor(
    private elementRef: ElementRef,
    private userService: AccountService,
    private router: Router,
    private userCookieService: UserCookieService,
    private imageServerControlService: ServerImageControlService,
    private imageClientControlService: ClientImageControlService,
    private authService: AuthService,
    private errorHandler:ErrorHandlerService
  ) { }
  ngOnInit(): void {
    const jwt = this.userCookieService.getJwt()
    if (!jwt) {
      this.router.navigateByUrl('/login')
      return
    }
    this.pageInit(jwt)
  }
  pageInit(jwt:string){
    let receiveUserData: accountFullInformation&{furnitureCards:any}
    this.userService.GETuser(jwt)
      .subscribe({
        next: (response) => {
          const receiveData = (response as any).userData as any
          receiveUserData = {
            email: receiveData.email,
            nickname: receiveData.nickname,
            projects: receiveData.projects,
            avatarUrl: this.imageServerControlService.GETuserAvatar(jwt),
            furnitureCards:receiveData.furnitureCards
          }
          receiveUserData.furnitureCards=receiveUserData.furnitureCards.map((furnitureData:any)=>{
            return {
              furnitureCardId:furnitureData._id,
              name:furnitureData.name,
              previewUrl:this.imageServerControlService.GETmainImage(furnitureData._id,furnitureData.colors[0].color)
            }
          })
          if (receiveData.password === undefined) return
          receiveUserData.password = receiveData.password
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while user loading',5000)
        },
        complete: () => {
          this.userData = receiveUserData
        }
      })
  }
  informationForm!: FormGroup
  ngAfterViewInit(): void {
    this.addModule = this.elementRef.nativeElement.querySelector('.addModule')
    this.informationForm = new FormGroup({
      nickname: new FormControl<string>('', [Validators.required])
    })
    if (this.userCookieService.getUserType() === 'email') {
      this.informationForm.addControl('password', new FormControl<string>('', [Validators.required]));
    }
  }
  async uploadAvatar(event: Event) {

    const jwt = this.userCookieService.getJwt()
    if (!jwt) return
    const TARGET_INPUT = event.target as HTMLInputElement
    const INPUT_IMAGE = TARGET_INPUT.files![0]
    if (!INPUT_IMAGE) return
    const COMPRESSED_IMAGE = await this.imageClientControlService.compressImage(INPUT_IMAGE)
    if (!COMPRESSED_IMAGE) return
    this.imageServerControlService.POSTloadUserAvatar(COMPRESSED_IMAGE, jwt)
      .subscribe({
        next: (resolve) => {
          this.userData!.avatarUrl = URL.createObjectURL(COMPRESSED_IMAGE);
        },
        error: (error) => {
          this.errorHandler.setError('Error while loading avatar',5000)
          console.log(error)
        }
      })
  }


  closeAddModule() {
    this.addModule.classList.add('disabled');
  }
  openAddModule() {
    if (!this.userData) return;
    this.addModule.classList.remove('disabled');
    this.informationForm.patchValue({
      nickname: this.userData.nickname
    })
    if (this.userCookieService.getUserType() === 'email') {
      this.informationForm.patchValue({
        password: this.userData.password
      })
    }
  }

  submitChanges() {
    if (!this.userData || !this.informationForm.valid) return
    
    const jwt = this.userCookieService.getJwt()
    const userType = this.userCookieService.getUserType() as userType
    if (!jwt || !userType) return
    const typeJwt = 'long'

    this.addModule.classList.add('disabled');

    const CHANGES_SECONDARY_DATA: accountChangeSecondaryData = { nickname: this.informationForm.value.nickname! }
    this.userService.PUTupdateSecondaryInformation(jwt, CHANGES_SECONDARY_DATA, userType)
      .subscribe({
        next: (response) => {
          this.userData!.nickname=CHANGES_SECONDARY_DATA.nickname
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while updating data',5000)
        }
      })

    let CHANGES_BASE_DATA: accountChangeBaseData | null = null
    if (this.userData.password !== undefined) CHANGES_BASE_DATA = { password: this.informationForm.value.password! }
    if (!CHANGES_BASE_DATA) { return }
    this.authService.PUTupdateBaseData(jwt, CHANGES_BASE_DATA, typeJwt, userType)
      .subscribe({
        next: (response) => {
        this.userData!.password=CHANGES_BASE_DATA.password
        },
        error: (error) => {
          this.errorHandler.setError('Error while updating data',5000)
          console.log(error)
        }
      })
  }
  getFurnitureImageUrl(furnitureCardId:string,color:string){
    return this.imageServerControlService.GETmainImage(furnitureCardId,color)
  }
  openProjectsPage(idPlan:number){
    this.router.navigateByUrl('/plan/'+idPlan)
  }
  logout(){
    this.userCookieService.deleteJwt()
    this.userCookieService.deleteUserType()
    this.router.navigateByUrl('/')
  }
}
