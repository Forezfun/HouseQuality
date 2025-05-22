import { Component, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { accountFullData, AccountService, accountType } from '../../services/account.service';
import { FormGroup, ReactiveFormsModule, FormControl, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountCookieService } from '../../services/account-cookie.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
/**
 * Интерфейс для формы редактирования аккаунта
 */
interface editForm {
  /** Контрол для редактирования никнейма */
  nickname: FormControl<string | null | undefined>;
  /** Контрол для редактирования пароля (необязательный) */
  password?: FormControl<string | null | undefined>;
}

/**
 * Компонент страницы аккаунта пользователя
 */
@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements OnInit {
  /**
   * Данные аккаунта пользователя
   */
  protected accountData?: accountFullData;

  /**
   * Флаг открытия формы редактирования
   */
  protected isEditFormOpen = false;

  /**
   * Группа контролов формы редактирования
   */
  protected editForm!: FormGroup<editForm>;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private accountCookieService: AccountCookieService,
    private imageServerControlService: ServerImageControlService,
    private imageClientControlService: ClientImageControlService,
    private authService: AuthService,
    private notification: NotificationService
  ) { }

  /**
   * Инициализация компонента
   * Проверяет авторизацию и загружает данные пользователя,
   * инициализирует форму редактирования
   */
  ngOnInit(): void {
    this.checkAuthAndLoadData();
    this.initEditForm();
  }

  /**
   * Обновляет вторичные данные аккаунта (например, никнейм)
   * @param jwt JWT токен пользователя
   */
  private async updateSecondaryAccountData(jwt: string) {
    if (!this.accountData) return;

    const CHANGE_DATA = {
      jwt: jwt,
      nickname: this.editForm.value.nickname!
    };

    try {
      await this.accountService.PUTupdateSecondaryAccountData(CHANGE_DATA);
      this.accountData.nickname = this.editForm.value.nickname!;
      this.notification.setSuccess('Данные обновлены', 5000);
    } catch (error) {
      this.notification.setError('Ошибка обновления никнейма', 5000);
      console.error(error);
      throw error;
    }
  }

  /**
   * Сохраняет изменения данных аккаунта
   */
  protected async saveChanges() {
    if (!this.accountData || !this.editForm.valid) {
      this.notification.setError('Некорректные данные формы', 5000);
      return;
    }

    const JWT = this.accountCookieService.getJwt();
    const ACCOUNT_TYPE = this.accountCookieService.getUserType() as accountType;
    if (!JWT || !ACCOUNT_TYPE) {
      this.notification.setError('Ошибка аутентификации', 5000);
      return;
    }

    try {
      await this.updateSecondaryAccountData(JWT);
      await this.updateBaseDataIfNeeded(JWT, ACCOUNT_TYPE);
      this.closeEditForm();
      this.notification.setSuccess('Данные обновлены', 5000);
    } catch (error) {
      this.notification.setError('Ошибка сохранения данных', 5000);
      console.error(error);
    }
  }

  /**
   * Обновляет основные данные аккаунта, если это необходимо
   * @param jwt JWT токен пользователя
   * @param accountType Тип аккаунта ('email' или 'google')
   */
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
      this.notification.setError('Ошибка обновления пароля', 5000);
      console.error(error);
      throw error;
    }
  }

  /**
   * Загружает данные пользователя с сервера по JWT
   * @param jwt JWT токен пользователя
   */
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
      console.error(error);
    }
  }

  /**
   * Обработка загрузки аватара пользователя
   * @param event Событие выбора файла
   */
  protected async uploadAvatar(event: Event) {
    const JWT = this.accountCookieService.getJwt();
    if (!JWT || !this.accountData) {
      return;
    }

    const TARGET = event.target as HTMLInputElement;
    const FILE = TARGET.files?.[0];
    if (!FILE) {
      this.notification.setError('Файл не выбран', 5000);
      return;
    }

    try {
      const COMPRESSED_IMAGE = await this.imageClientControlService.compressImage(FILE);
      if (!COMPRESSED_IMAGE) {
        this.notification.setError('Ошибка сжатия изображения', 5000);
        return;
      }

      await this.imageServerControlService.POSTuploadUserAvatar(COMPRESSED_IMAGE, JWT);
      this.accountData.avatarUrl = URL.createObjectURL(COMPRESSED_IMAGE);
      this.notification.setSuccess('Аватар обновлен', 5000);
    } catch (error) {
      this.notification.setError('Ошибка загрузки аватара', 5000);
      console.error(error);
    }
  }

  /**
   * Проверяет авторизацию пользователя и загружает данные аккаунта
   */
  private checkAuthAndLoadData() {
    const JWT = this.accountCookieService.getJwt();
    if (!JWT) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.loadUserData(JWT);
  }

  /**
   * Инициализирует форму редактирования с валидаторами
   */
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

  /**
   * Открывает форму редактирования
   */
  protected openEditForm() {
    if (!this.accountData) {
      this.notification.setError('Данные пользователя не загружены', 5000);
      return;
    }
    this.isEditFormOpen = true;
  }

  /**
   * Закрывает форму редактирования и сбрасывает изменения
   */
  protected closeEditForm() {
    this.isEditFormOpen = false;
    if (this.accountData) {
      // Важно: здесь не происходит обновления значений, а скорее попытка сравнить (исправить можно)
      this.accountData.nickname != this.editForm.value.nickname;
      if (this.accountData.password) {
        this.accountData.password != this.editForm.value.password;
      }
    }
    this.editForm.reset();
  }

  /**
   * Открывает страницу проекта по id
   * @param projectId ID проекта
   */
  protected openProject(projectId: number) {
    this.router.navigateByUrl('/plan/' + projectId);
  }

  /**
   * Выход из аккаунта:
   * удаляет JWT и тип аккаунта из куков, вызывает удаление JWT на сервере,
   * и перенаправляет на главную страницу
   */
  protected logout() {
    const JWT = this.accountCookieService.getJwt();
    if (JWT) this.accountService.DELETEaccountJwt(JWT);
    this.accountCookieService.deleteJwt();
    this.accountCookieService.deleteAccountType();
    this.router.navigateByUrl('/');
  }
}
