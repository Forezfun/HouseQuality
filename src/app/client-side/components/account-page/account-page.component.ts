import { Component, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { accountFullData, AccountService, accountType } from '../../services/account.service';
import { FormGroup, ReactiveFormsModule, FormControl, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AcountCookieService } from '../../services/account-cookie.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

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
    private accountService: AccountService,
    private router: Router,
    private accountCookieService: AcountCookieService,
    private imageServerControlService: ServerImageControlService,
    private imageClientControlService: ClientImageControlService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService
  ) { }

  protected accountData?: accountFullData;
  protected isEditFormOpen = false;
  protected editForm!: FormGroup<editForm>;

  ngOnInit(): void {
    this.checkAuthAndLoadData();
    this.initEditForm();
  }

  private async updateSecondaryAccountData(jwt: string) {
    if (!this.accountData) return;

    const CHANGE_DATA = {
      jwt: jwt,
      nickname: this.editForm.value.nickname!
    };

    try {
      await this.accountService.PUTupdateSecondaryAccountData(CHANGE_DATA);
      this.accountData.nickname = this.editForm.value.nickname!;
    } catch (error) {
      this.errorHandler.setError('Ошибка обновления никнейма', 5000);
      console.error(error);
      throw error;
    }
  }
  protected async saveChanges() {
    if (!this.accountData || !this.editForm.valid) {
      this.errorHandler.setError('Некорректные данные формы', 5000);
      return;
    }

    const JWT = this.accountCookieService.getJwt();
    const ACCOUNT_TYPE = this.accountCookieService.getUserType() as accountType;
    if (!JWT || !ACCOUNT_TYPE) {
      this.errorHandler.setError('Ошибка аутентификации', 5000);
      return;
    }

    try {
      await this.updateSecondaryAccountData(JWT);
      await this.updateBaseDataIfNeeded(JWT, ACCOUNT_TYPE);
      this.closeEditForm();
    } catch (error) {
      this.errorHandler.setError('Ошибка сохранения данных', 5000);
      console.error(error);
    }
  }
  private async updateBaseDataIfNeeded(jwt: string, accountType: accountType) {
    if (this.accountData?.password === undefined || !this.editForm.value.password || accountType === 'google') return;

    const CHANGE_DATA = {
      jwt: jwt,
      accountType: accountType,
      password: this.editForm.value.password
    };

    try {
      await this.authService.PUTupdateBaseData(CHANGE_DATA);
      this.accountData.password = this.editForm.value.password;
    } catch (error) {
      this.errorHandler.setError('Ошибка обновления пароля', 5000);
      console.error(error);
      throw error;
    }
  }
  private async loadUserData(jwt: string) {
    try {
      const ACCOUNT_DATA = (await this.accountService.GETaccount(jwt)).accountData;
      this.accountData = {
        email: ACCOUNT_DATA.email,
        nickname: ACCOUNT_DATA.nickname,
        projects: ACCOUNT_DATA.projects,
        avatarUrl: this.imageServerControlService.GETaccountAvatar(jwt),
        furnitures: ACCOUNT_DATA.furnitures
      };

      if (ACCOUNT_DATA.password !== undefined) {
        this.accountData.password = ACCOUNT_DATA.password;
      }
    } catch (error) {
      this.errorHandler.setError('Ошибка загрузки данных пользователя', 5000);
      console.error(error);
    }
  }
  protected async uploadAvatar(event: Event) {
    const JWT = this.accountCookieService.getJwt();
    if (!JWT || !this.accountData) {
      this.errorHandler.setError('Ошибка аутентификации', 5000);
      return;
    }

    const TARGET = event.target as HTMLInputElement;
    const FILE = TARGET.files?.[0];
    if (!FILE) {
      this.errorHandler.setError('Файл не выбран', 5000);
      return;
    }

    try {
      const COMPRESSED_IMAGE = await this.imageClientControlService.compressImage(FILE);
      if (!COMPRESSED_IMAGE) {
        this.errorHandler.setError('Ошибка сжатия изображения', 5000);
        return;
      }

      await this.imageServerControlService.POSTuploadUserAvatar(COMPRESSED_IMAGE, JWT);
      this.accountData.avatarUrl = URL.createObjectURL(COMPRESSED_IMAGE);
    } catch (error) {
      this.errorHandler.setError('Ошибка загрузки аватара', 5000);
      console.error(error);
    }
  }

  private checkAuthAndLoadData() {
    const JWT = this.accountCookieService.getJwt();
    if (!JWT) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.loadUserData(JWT);
  }
  private initEditForm() {
    this.editForm = new FormGroup({
      nickname: new FormControl(this.accountData?.nickname, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ])
    });

    if (this.accountCookieService.getUserType() === 'email') {
      this.editForm.addControl('password', new FormControl(this.accountData?.password, [
        Validators.required,
        Validators.minLength(6)
      ]));
    }
  }
  protected openEditForm() {
    if (!this.accountData) {
      this.errorHandler.setError('Данные пользователя не загружены', 5000);
      return;
    }
    this.isEditFormOpen = true;
  }
  protected closeEditForm() {
    this.isEditFormOpen = false;
    if (this.accountData) {
      this.accountData.nickname != this.editForm.value.nickname;
      if (this.accountData.password) {
        this.accountData.password != this.editForm.value.password;
      }
    }
    this.editForm.reset();
  }
  protected openProject(projectId: number) {
    this.router.navigateByUrl('/plan/' + projectId);
  }
  protected logout() {
    this.accountCookieService.deleteJwt();
    this.accountCookieService.deleteUserType();
    this.router.navigateByUrl('/');
  }
}