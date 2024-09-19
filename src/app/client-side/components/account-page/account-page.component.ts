import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { accountFullInformation, AccountService } from '../../services/account.service';
import { FormGroup,ReactiveFormsModule,FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UserCookieService } from '../../services/user-cookie.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ClientImageControlService } from '../../services/client-image-control.service';
@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf,ReactiveFormsModule,CommonModule],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss'
})
export class AccountPageComponent implements AfterViewInit,OnInit{
  private addModule!: HTMLDivElement;
  userData?:accountFullInformation
  constructor(
    private elementRef:ElementRef,
    private userService:AccountService,
    private router:Router,
    private userCookieService:UserCookieService,
    private imageServerControlService:ServerImageControlService,
    private imageClientControlService:ClientImageControlService
  ){}
  ngOnInit(): void {
    if(!this.userService.checkJwt())this.router.navigateByUrl('/login')
    let receiveUserData:accountFullInformation

    const jwt = this.userCookieService.getJwt()
    this.userService.GETuser(jwt)
  .subscribe({
    next:(response)=>{
      console.log(response)
      const receiveData = (response as any).userData as accountFullInformation
      receiveUserData={
        email:receiveData.email,
        nickname:receiveData.nickname,
        projects:receiveData.projects,
        avatarUrl:this.imageServerControlService.GETuserAvatar(jwt)
      }
      if(receiveData.password===undefined)return
      receiveUserData.password=receiveData.password
    },
    error:(error)=>{
      console.log(error)
    },
    complete:()=>{
      this.userData = receiveUserData
        }
  })

  }
  ngAfterViewInit(): void {
    this.addModule=this.elementRef.nativeElement.querySelector('.addModule')
    this.informationForm.patchValue({
      nickname:this.accountxampleData.nickname,
      email:this.accountxampleData.email
    })
    if(this.accountxampleData.password===undefined)return
    this.informationForm.patchValue({
      password:this.accountxampleData.password
    })
  }
  async loadAvatar(event:Event){
    const jwt = this.userCookieService.getJwt()
    if(!jwt)return
    console.log(event)
    const TARGET_INPUT = event.target as HTMLInputElement
    const INPUT_IMAGE = TARGET_INPUT.files![0]
    if(!INPUT_IMAGE)return
    console.log(INPUT_IMAGE)
    const COMPRESSED_IMAGE = await this.imageClientControlService.compressImage(INPUT_IMAGE)
    if(!COMPRESSED_IMAGE)return
    console.log(COMPRESSED_IMAGE) 
    this.imageServerControlService.POSTloadUserAvatar(COMPRESSED_IMAGE,jwt)
    .subscribe({
      next:(resolve)=>{
        console.log(resolve)
      },
      error:(error)=>{
        console.log(error)
      }
    })
  }
  informationForm = new FormGroup({
    nickname:new FormControl<string>('',[Validators.required]),
    email:new FormControl<string>('',[Validators.required]),
    password:new FormControl<string>('',[Validators.required])
  })

  closeAddModule() {
    this.addModule.classList.add('disabled');
  }
  openAddModule(){
    this.addModule.classList.remove('disabled');
  }
  
  accountxampleData: accountFullInformation = {
    nickname: 'Forezfun-',
    email: 'windowspls@mail.ru',
    password: 'test',
    avatarUrl: '/assets/images/Account.png',
    projects: [{
      rooms: [
        {
      name:'Гостинная',
      gridArea: '1 / 1 / 3 / 4',
      roomProportions:{
        width:3,
        length:2,
        height:3
      }
    },
    {
      name:'Спальня',
      gridArea: '3 / 1 / 4 / 2',
      roomProportions:{
        width:1,
        length:1,
        height:3
      }
    },
    {
      name:'Спальня',
      gridArea: ' 4 / 1 / 5 / 2',
      roomProportions:{
        width:1,
        length:1,
        height:3
      }
    },
    {
      name:'Прихожая',
      gridArea: '5 / 1 / 8 / 5',
      roomProportions:{
        width:4,
        length:3,
        height:3
      }
    },
    {
      name:'Санузел',
      gridArea: ' 3 / 2 / 5 / 4',
      roomProportions:{
        width:2,
        length:2,
        height:3
      }
    }
      ],
      nameProject: 'Home'
    }]
  }

  submitChanges(){

  }
}
