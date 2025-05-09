import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControlOptions, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { AccountService, accountType, createAccountData} from '../../services/account.service';
import { UserCookieService } from '../../services/account-cookie.service';
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
  @ViewChild('signup', { read: TemplateRef }) signupTemplate!: TemplateRef<any>;
  @ViewChild('signin', { read: TemplateRef }) signinTemplate!: TemplateRef<any>;
  @ViewChild('code', { read: TemplateRef }) codeTemplate!: TemplateRef<any>;
  @ViewChild('changePassword', { read: TemplateRef }) changePasswordTemplate!: TemplateRef<any>;
  @ViewChild('requestPasswordChange', { read: TemplateRef }) requestPasswordChangeTemplate!: TemplateRef<any>;

  currentFormTemplate!: TemplateRef<any>;
  inputValues: string[] = new Array(4).fill('');

  signupForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    nickname: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  });

  codeForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  private passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const form = control as FormGroup;
    return form.get('newPassword')?.value === form.get('repeatPassword')?.value
      ? null : { mismatch: true };
  };
  changePasswordForm = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    repeatPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
  }, { validators: this.passwordMatchValidator } as AbstractControlOptions);

  signinForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  requestChangeForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private userService: AccountService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private userCookieService: UserCookieService,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.currentFormTemplate = this.signinTemplate;
    this.cdr.detectChanges();
  }


  onInput(current: HTMLInputElement, next: HTMLInputElement | null) {
    this.codeForm.patchValue({ code: this.inputValues.join('') });
    if (next && current.value) next.focus();
  }

  onBackspace(current: HTMLInputElement, prev: HTMLInputElement | null) {
    if (!current.value && prev) prev.focus();
    this.codeForm.patchValue({ code: this.inputValues.join('') });
  }

  changeTemplate(template: string) {
    const templates: Record<string, TemplateRef<any>> = {
      'requestChange': this.requestPasswordChangeTemplate,
      'code': this.codeTemplate,
      'signin': this.signinTemplate,
      'signup': this.signupTemplate,
      'changePassword': this.changePasswordTemplate
    };

    this.currentFormTemplate = templates[template] || this.signinTemplate;
  }
  private currentChangeCode: number | undefined
  private currentJwtToken: string | undefined
  async requestChangeCode() {
    if (this.requestChangeForm.invalid) return;
    try {
      this.currentChangeCode = (await this.authService.GETrequestPasswordCode(this.requestChangeForm.value.email!)).resetCode
      this.changeTemplate('code')
    } catch (error) {
      console.log(error)
    }
  }

  async signinUser() {
    if (this.signinForm.invalid) return;
    const data = {
      email:this.signinForm.value.email!,
      password:this.signinForm.value.password!,
      accountType:'email' as accountType
    };
    try {
      const jwtToken = (await this.authService.POSTcreateLongJWT(data)).jwtToken
      this.userCookieService.setJwt(jwtToken,'long')
      this.userCookieService.setUserType('email')
      this.router.navigateByUrl('/account')
    } catch (error) {
      console.log(error)
    }

  }

  async signUpUser() {
    if (this.signupForm.invalid) return;
    try {
      const accountData:createAccountData = {
        email: this.signupForm.value.email!,
        password: this.signupForm.value.password!,
        nickname: this.signupForm.value.nickname!,
        accountType:'email'
      };
      await this.userService.POSTcreateAccount(accountData)
      const jwtToken = (await this.authService.POSTcreateLongJWT(accountData)).jwtToken
      this.userCookieService.setJwt(jwtToken, 'long')
      this.userCookieService.setUserType('email')
      this.router.navigateByUrl('/account')
    } catch (error) {
      console.log(error)
    }
  }

  async changePasswordUser() {
    if (this.changePasswordForm.invalid||!this.currentJwtToken) return;
    const changeData = {
      password: this.changePasswordForm.value.newPassword!,
      accountType:'email' as const,
      jwt:this.currentJwtToken
    }
    try {     
      await this.authService.PUTupdateBaseData(changeData)
      this.changeTemplate('signin')
    } catch (error) {
      console.log(error)
    }

  }
  async checkMatchCodes() {
    if (this.codeForm.value.code === this.currentChangeCode) {
      try {
        this.currentJwtToken = (await this.authService.POSTcreateShortJWT(this.requestChangeForm.value.email!)).jwtToken
        this.changeTemplate('changePassword')
      } catch (error) {
        console.log(error)
      }
    } else {
      this.errorHandler.setError('Неверный код', 2500)
    }
  }
}