import { AfterViewInit, ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControlOptions, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { AccountService, accountType, createAccountData } from '../../services/account.service';
import { AcountCookieService } from '../../services/account-cookie.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [NavigationPanelComponent, ReactiveFormsModule, NgTemplateOutlet, FormsModule, NgIf],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements AfterViewInit {
  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private accountCookieService: AcountCookieService,
    private cdr: ChangeDetectorRef
  ) { }

  protected currentFormTemplate!: TemplateRef<any>;
  protected inputValues: string[] = new Array(4).fill('');
  private currentChangeCode: number | undefined
  private currentJwtToken: string | undefined

  @ViewChild('signup', { read: TemplateRef }) private signupTemplate!: TemplateRef<any>;
  @ViewChild('signin', { read: TemplateRef }) private signinTemplate!: TemplateRef<any>;
  @ViewChild('code', { read: TemplateRef }) private codeTemplate!: TemplateRef<any>;
  @ViewChild('changePassword', { read: TemplateRef }) private changePasswordTemplate!: TemplateRef<any>;
  @ViewChild('requestPasswordChange', { read: TemplateRef }) private requestPasswordChangeTemplate!: TemplateRef<any>;

  ngAfterViewInit(): void {
    this.currentFormTemplate = this.signinTemplate;
    this.cdr.detectChanges();
  }

  protected async requestChangeCode() {
    if (this.requestChangeForm.invalid) return;
    try {
      this.currentChangeCode = (await this.authService.GETrequestPasswordCode(this.requestChangeForm.value.email!)).resetCode
      this.changeTemplate('code')
    } catch (error) {
      console.log(error)
    }
  }
  protected async signinUser() {
    if (this.signinForm.invalid) return;
    const SIGN_DATA = {
      email: this.signinForm.value.email!,
      password: this.signinForm.value.password!,
      accountType: 'email' as accountType
    };
    try {
      const JWT = (await this.authService.POSTcreateLongJWT(SIGN_DATA)).jwt
      this.accountCookieService.setJwt(JWT, 'long')
      this.accountCookieService.setUserType('email')
      this.router.navigateByUrl('/account')
    } catch (error) {
      console.log(error)
    }

  }
  protected async signUpUser() {
    if (this.signupForm.invalid) return;
    try {
      const ACCOUNT_DATA: createAccountData = {
        email: this.signupForm.value.email!,
        password: this.signupForm.value.password!,
        nickname: this.signupForm.value.nickname!,
        accountType: 'email'
      };
      await this.accountService.POSTcreateAccount(ACCOUNT_DATA)
      const JWT = (await this.authService.POSTcreateLongJWT(ACCOUNT_DATA)).jwt
      this.accountCookieService.setJwt(JWT, 'long')
      this.accountCookieService.setUserType('email')
      this.router.navigateByUrl('/account')
    } catch (error) {
      console.log(error)
    }
  }
  protected async changePasswordUser() {
    if (this.changePasswordForm.invalid || !this.currentJwtToken) return;
    const CHANGE_DATA = {
      password: this.changePasswordForm.value.newPassword!,
      accountType: 'email' as const,
      jwt: this.currentJwtToken
    }
    try {
      await this.authService.PUTupdateBaseData(CHANGE_DATA)
      this.changeTemplate('signin')
    } catch (error) {
      console.log(error)
    }

  }
  protected async checkMatchCodes() {
    if (this.codeForm.value.code === this.currentChangeCode) {
      try {
        this.currentJwtToken = (await this.authService.POSTcreateShortJWT(this.requestChangeForm.value.email!)).jwt
        this.changeTemplate('changePassword')
      } catch (error) {
        console.log(error)
      }
    } else {
      this.errorHandler.setError('Неверный код', 2500)
    }
  }

  private passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const FORM = control as FormGroup;
    return FORM.get('newPassword')?.value === FORM.get('repeatPassword')?.value
      ? null : { mismatch: true };
  };
  protected onInput(current: HTMLInputElement, next: HTMLInputElement | null) {
    this.codeForm.patchValue({ code: this.inputValues.join('') });
    if (next && current.value) next.focus();
  }
  protected onBackspace(current: HTMLInputElement, prev: HTMLInputElement | null) {
    if (!current.value && prev) prev.focus();
    this.codeForm.patchValue({ code: this.inputValues.join('') });
  }
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

  protected signupForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    nickname: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  });
  protected codeForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(4)])
  });
  protected changePasswordForm = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    repeatPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
  }, { validators: this.passwordMatchValidator } as AbstractControlOptions);
  protected signinForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });
  protected requestChangeForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });
}