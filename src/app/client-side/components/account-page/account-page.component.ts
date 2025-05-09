import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { accountFullData, AccountService, furnitureAccountData, accountType } from '../../services/account.service';
import { FormGroup, ReactiveFormsModule, FormControl, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserCookieService } from '../../services/account-cookie.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { furnitureClientData } from '../../services/furniture-card-control.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements AfterViewInit, OnInit {
  userData?: accountFullData
  isEditFormOpen = false;
  editForm!: FormGroup;

  constructor(
    private elementRef: ElementRef,
    private userService: AccountService,
    private router: Router,
    private userCookieService: UserCookieService,
    private imageServerControlService: ServerImageControlService,
    private imageClientControlService: ClientImageControlService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private accountService:AccountService
  ) { }

  ngOnInit(): void {
    this.checkAuthAndLoadData();
    this.initEditForm();
  }

  ngAfterViewInit(): void {
    // Инициализация, если требуется
  }

  private checkAuthAndLoadData(): void {
    const jwt = this.userCookieService.getJwt();
    if (!jwt) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.loadUserData(jwt);
  }

  private async loadUserData(jwt: string) {
    try {
      const accountData = (await this.userService.GETaccount(jwt)).accountData
      this.userData = {
        email: accountData.email,
        nickname: accountData.nickname,
        projects: accountData.projects,
        avatarUrl: this.imageServerControlService.GETuserAvatar(jwt),
        furnitures: accountData.furnitures
      };
      if (accountData.password !== undefined) {
        this.userData.password = accountData.password;
      }
    } catch (error) {
      console.log(error)
    }
  }


  private initEditForm(): void {
    this.editForm = new FormGroup({
      nickname: new FormControl(this.userData?.nickname, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ])
    });

    console.log(this.userCookieService.getUserType())
    if (this.userCookieService.getUserType() === 'email') {
      this.editForm.addControl('password', new FormControl(this.userData?.password, [
        Validators.required,
        Validators.minLength(6)
      ]));
    }
  }

  async uploadAvatar(event: Event): Promise<void> {
    const jwt = this.userCookieService.getJwt();
    if (!jwt||!this.userData) return;

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await this.imageClientControlService.compressImage(file);
      if (!compressedImage) return;

      await this.imageServerControlService.POSTuploadUserAvatar(compressedImage, jwt)
      this.userData.avatarUrl = URL.createObjectURL(compressedImage);
    } catch (error) {
      console.error(error);
      this.errorHandler.setError('Ошибка обработки изображения', 5000);
    }
  }

  openEditForm(): void {
    if (!this.userData) return;

    this.isEditFormOpen = true;
  }

  closeEditForm(): void {
    this.isEditFormOpen = false;
    this.editForm.reset();
  }

  saveChanges(): void {
    if (!this.userData || !this.editForm.valid) return;

    const jwt = this.userCookieService.getJwt();
    const accountType = this.userCookieService.getUserType() as accountType;
    if (!jwt || !accountType) return;

    this.updateSecondaryAccountData(jwt);
    this.updateBaseDataIfNeeded(jwt, accountType);

    this.closeEditForm();
  }

  private async updateSecondaryAccountData(jwt: string) {
    if(!this.userData)return
    const changeData = {
      jwt:jwt,
      nickname: this.userData.nickname
    }
    try {
      await this.accountService.PUTupdateSecondaryAccountData(changeData)
    } catch (error) {
      console.log(error)
    }
  }

  private async updateBaseDataIfNeeded(jwt: string, accountType: accountType) {
    if (this.userData?.password === undefined || !this.editForm.value.password||accountType==='google') return;
    try {
      const changeData={
        jwt:jwt,
        accountType:accountType,
        password:this.editForm.value.password
      }
      this.userData.password = this.editForm.value.password;
      await this.authService.PUTupdateBaseData(changeData)
    } catch (error) {
      console.log(error)
    }

  }

  getFurnitureImageUrl(furnitureCardId: string, color: string): string {
    return this.imageServerControlService.GETmainImage(furnitureCardId, color);
  }

  openProject(projectId: number): void {
    this.router.navigateByUrl('/plan/' + projectId);
  }

  logout(): void {
    this.userCookieService.deleteJwt();
    this.userCookieService.deleteUserType();
    this.router.navigateByUrl('/');
  }
}

