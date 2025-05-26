import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControlOptions, ValidatorFn, AbstractControl } from '@angular/forms';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { AccountService, accountType, createAccountData } from '../../services/account.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

/**
 * Компонент страницы авторизации/регистрации/смены пароля.
 * Использует шаблонный подход с TemplateRef для смены форм.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [NavigationPanelComponent, ReactiveFormsModule, NgTemplateOutlet, FormsModule, NgIf],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements AfterViewInit, OnInit {

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService,
    private accountCookieService: AccountCookieService,
    private cdr: ChangeDetectorRef
  ) { }

  /** Текущий отображаемый шаблон формы */
  protected currentFormTemplate!: TemplateRef<any>;

  /** Значения ввода кода подтверждения (используется 4 поля ввода) */
  protected inputValues: string[] = new Array(4).fill('');

  /** Код для смены пароля, полученный с сервера */
  private currentChangeCode: number | undefined;

  /** Временный JWT-токен для изменения пароля */
  private currentJwtToken: string | undefined;

  /** Шаблон формы регистрации */
  @ViewChild('signup', { read: TemplateRef }) private signupTemplate!: TemplateRef<any>;
  /** Шаблон формы входа */
  @ViewChild('signin', { read: TemplateRef }) private signinTemplate!: TemplateRef<any>;
  /** Шаблон ввода кода */
  @ViewChild('code', { read: TemplateRef }) private codeTemplate!: TemplateRef<any>;
  /** Шаблон смены пароля */
  @ViewChild('changePassword', { read: TemplateRef }) private changePasswordTemplate!: TemplateRef<any>;
  /** Шаблон запроса смены пароля */
  @ViewChild('requestPasswordChange', { read: TemplateRef }) private requestPasswordChangeTemplate!: TemplateRef<any>;

  /**
 * Инициализация компонента.
 * Проверяет на наличие JWT в cookie и перенаправляет на аккаунт, если он есть.
 */
  ngOnInit(): void {
    const JWT = this.accountCookieService.getJwt();
    if (JWT) {
      this.router.navigateByUrl('/account');
    }
  }
  /**
   * Устанавливает форму входа как текущую форму.
   */
  ngAfterViewInit(): void {
    this.currentFormTemplate = this.signinTemplate;
    this.cdr.detectChanges();
  }

  /**
   * Запрашивает код подтверждения для смены пароля.
   */
  protected async requestChangeCode() {
    if (this.requestChangeForm.invalid) return;
    try {
      this.currentChangeCode = (await this.authService.GETrequestPasswordCode(this.requestChangeForm.value.email!)).resetCode;
      this.changeTemplate('code');
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Авторизует пользователя по email и паролю.
   */
  protected async signinUser() {
    if (this.signinForm.invalid) return;
    const SIGN_DATA = {
      email: this.signinForm.value.email!,
      password: this.signinForm.value.password!,
      accountType: 'email' as accountType
    };
    try {
      const JWT = (await this.authService.POSTcreateLongJWT(SIGN_DATA)).jwt;
      this.accountCookieService.setJwt(JWT, 'long');
      this.accountCookieService.setUserType('email');
      this.router.navigateByUrl('/account');
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Регистрирует нового пользователя.
   */
  protected async signUpUser() {
    if (this.signupForm.invalid) return;
    try {
      const ACCOUNT_DATA: createAccountData = {
        email: this.signupForm.value.email!,
        password: this.signupForm.value.password!,
        nickname: this.signupForm.value.nickname!,
        accountType: 'email'
      };
      await this.accountService.POSTcreateAccount(ACCOUNT_DATA);
      const JWT = (await this.authService.POSTcreateLongJWT(ACCOUNT_DATA)).jwt;
      this.accountCookieService.setJwt(JWT, 'long');
      this.accountCookieService.setUserType('email');
      this.router.navigateByUrl('/account');
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Меняет пароль пользователя с использованием временного JWT.
   */
  protected async changePasswordUser() {
    if (this.changePasswordForm.invalid || !this.currentJwtToken) return;
    const CHANGE_DATA = {
      password: this.changePasswordForm.value.newPassword!,
      accountType: 'email' as const,
      jwt: this.currentJwtToken
    };
    try {
      await this.authService.PUTupdateBaseData(CHANGE_DATA);
      this.changeTemplate('signin');
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Проверяет введённый код подтверждения.
   * При совпадении выдаёт временный JWT и переключает на форму смены пароля.
   */
  protected async checkMatchCodes() {
    if (this.codeForm.value.code === this.currentChangeCode) {
      try {
        this.currentJwtToken = (await this.authService.POSTcreateShortJWT(this.requestChangeForm.value.email!)).jwt;
        this.changeTemplate('changePassword');
      } catch (error) {
        console.log(error);
      }
    } else {
      this.notification.setError('Неверный код', 2500);
    }
  }

  /**
   * Валидатор совпадения нового пароля и повтора.
   */
  private passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const FORM = control as FormGroup;
    return FORM.get('newPassword')?.value === FORM.get('repeatPassword')?.value
      ? null : { mismatch: true };
  };

  /**
   * Обрабатывает ввод в поле кода.
   * @param current Текущий input элемент
   * @param next Следующий input элемент (если есть)
   */
  protected onInput(current: HTMLInputElement, next: HTMLInputElement | null) {
    this.codeForm.patchValue({ code: this.inputValues.join('') });
    if (next && current.value) next.focus();
  }

  /**
   * Обрабатывает удаление символа (Backspace) в поле кода.
   * @param current Текущий input элемент
   * @param prev Предыдущий input элемент (если есть)
   */
  protected onBackspace(current: HTMLInputElement, prev: HTMLInputElement | null) {
    if (!current.value && prev) prev.focus();
    this.codeForm.patchValue({ code: this.inputValues.join('') });
  }

  /**
   * Меняет текущую отображаемую форму.
   * @param template Ключ шаблона (signin, signup, code, requestChange, changePassword)
   */
  protected changeTemplate(template: string) {
    const TEMPLATES: Record<string, TemplateRef<any>> = {
      'requestChange': this.requestPasswordChangeTemplate,
      'code': this.codeTemplate,
      'signin': this.signinTemplate,
      'signup': this.signupTemplate,
      'changePassword': this.changePasswordTemplate
    };

    this.currentFormTemplate = TEMPLATES[template] || this.signinTemplate;
  }

  /** Форма регистрации */
  protected signupForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    nickname: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  });

  /** Форма ввода кода подтверждения */
  protected codeForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  /** Форма смены пароля */
  protected changePasswordForm = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    repeatPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
  }, { validators: this.passwordMatchValidator } as AbstractControlOptions);

  /** Форма входа */
  protected signinForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  /** Форма запроса смены пароля */
  protected requestChangeForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });
}
