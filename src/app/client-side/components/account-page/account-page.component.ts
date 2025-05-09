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

interface editForm {
  nickname: FormControl<string | null | undefined>;
  password?: FormControl<string | null | undefined>;
}

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements OnInit {

  constructor(
    private elementRef: ElementRef,
    private userService: AccountService,
    private router: Router,
    private userCookieService: UserCookieService,
    private imageServerControlService: ServerImageControlService,
    private imageClientControlService: ClientImageControlService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private accountService: AccountService
  ) { }

  public userData?: accountFullData;
  public isEditFormOpen = false;
  public editForm!: FormGroup<editForm>;

  ngOnInit(): void {
    this.checkAuthAndLoadData();
    this.initEditForm();
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
      const accountData = (await this.userService.GETaccount(jwt)).accountData;
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
      this.errorHandler.setError('Ошибка загрузки данных пользователя', 5000);
      console.error(error);
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

    if (this.userCookieService.getUserType() === 'email') {
      this.editForm.addControl('password', new FormControl(this.userData?.password, [
        Validators.required,
        Validators.minLength(6)
      ]));
    }
  }

  public async uploadAvatar(event: Event): Promise<void> {
    const jwt = this.userCookieService.getJwt();
    if (!jwt || !this.userData) {
      this.errorHandler.setError('Ошибка аутентификации', 5000);
      return;
    }

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      this.errorHandler.setError('Файл не выбран', 5000);
      return;
    }

    try {
      const compressedImage = await this.imageClientControlService.compressImage(file);
      if (!compressedImage) {
        this.errorHandler.setError('Ошибка сжатия изображения', 5000);
        return;
      }

      await this.imageServerControlService.POSTuploadUserAvatar(compressedImage, jwt);
      this.userData.avatarUrl = URL.createObjectURL(compressedImage);
    } catch (error) {
      this.errorHandler.setError('Ошибка загрузки аватара', 5000);
      console.error(error);
    }
  }

  public openEditForm(): void {
    if (!this.userData) {
      this.errorHandler.setError('Данные пользователя не загружены', 5000);
      return;
    }
    this.isEditFormOpen = true;
  }

  public closeEditForm(): void {
    this.isEditFormOpen = false;
    if (this.userData) {
      this.userData.nickname != this.editForm.value.nickname;
      if (this.userData.password) {
        this.userData.password != this.editForm.value.password;
      }
    }
    this.editForm.reset();
  }

  public async saveChanges() {
    if (!this.userData || !this.editForm.valid) {
      this.errorHandler.setError('Некорректные данные формы', 5000);
      return;
    }

    const jwt = this.userCookieService.getJwt();
    const accountType = this.userCookieService.getUserType() as accountType;
    if (!jwt || !accountType) {
      this.errorHandler.setError('Ошибка аутентификации', 5000);
      return;
    }

    try {
      await this.updateSecondaryAccountData(jwt);
      await this.updateBaseDataIfNeeded(jwt, accountType);
      this.closeEditForm();
    } catch (error) {
      this.errorHandler.setError('Ошибка сохранения данных', 5000);
      console.error(error);
    }
  }

  private async updateSecondaryAccountData(jwt: string) {
    if (!this.userData) return;

    const changeData = {
      jwt: jwt,
      nickname: this.editForm.value.nickname!
    };

    try {
      await this.accountService.PUTupdateSecondaryAccountData(changeData);
      this.userData.nickname = this.editForm.value.nickname!;
    } catch (error) {
      this.errorHandler.setError('Ошибка обновления никнейма', 5000);
      console.error(error);
      throw error;
    }
  }

  private async updateBaseDataIfNeeded(jwt: string, accountType: accountType) {
    if (this.userData?.password === undefined || !this.editForm.value.password || accountType === 'google') return;

    const changeData = {
      jwt: jwt,
      accountType: accountType,
      password: this.editForm.value.password
    };

    try {
      await this.authService.PUTupdateBaseData(changeData);
      this.userData.password = this.editForm.value.password;
    } catch (error) {
      this.errorHandler.setError('Ошибка обновления пароля', 5000);
      console.error(error);
      throw error;
    }
  }

  public getFurnitureImageUrl(furnitureCardId: string, color: string): string {
    return this.imageServerControlService.GETmainImage(furnitureCardId, color);
  }

  public openProject(projectId: number): void {
    this.router.navigateByUrl('/plan/' + projectId);
  }

  public logout(): void {
    this.userCookieService.deleteJwt();
    this.userCookieService.deleteUserType();
    this.router.navigateByUrl('/');
  }
}