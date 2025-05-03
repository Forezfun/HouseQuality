import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControlOptions, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { AccountService, accountBaseInformation, accountSignInData } from '../../services/account.service';
import { UserCookieService } from '../../services/user-cookie.service';
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
    email: new FormControl('', [Validators.required, Validators.email]),
    nickname: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required,Validators.minLength(6)])
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
    newPassword: new FormControl('', [Validators.required,Validators.minLength(6)]),
    repeatPassword: new FormControl('', [Validators.required,Validators.minLength(6)])
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
  requestChangeCode() {
    if (this.requestChangeForm.invalid) return;

    this.authService.GETrequestPasswordCode(this.requestChangeForm.value.email!)
      .subscribe({
        next: (value) => {
          this.currentChangeCode = value.resetCode
          this.changeTemplate('code')
        },
        error: (err) => this.errorHandler.setError('Ошибка запроса кода', 5000)
      });
  }

  signinUser() {
    if (this.signinForm.invalid) return;

    const data = this.signinForm.value as accountSignInData;
    this.authService.POSTcreateLongJWT(data, 'email')
      .subscribe({
        next: (value) => {
          this.userCookieService.setJwt(value.jwt, 'long')
          this.userCookieService.setUserType('email')
          this.router.navigateByUrl('/account')
        },
        error: (err) => this.errorHandler.setError('Ошибка входа', 5000)
      });
  }

  signUpUser() {
    if (this.signupForm.invalid) return;

    const data = this.signupForm.value as accountBaseInformation;
    this.userService.POSTcreateUser(data, 'email')
      .subscribe({
        next: (value) => {
          if (data.password !== undefined) {
            const AUTH_DATA: accountSignInData = {
              email: data.email,
              password: data.password
            }
            this.authService.POSTcreateLongJWT(AUTH_DATA, 'email')
              .subscribe({
                next: (value) => {
                  this.userCookieService.setJwt(value.jwt, 'long')
                  this.userCookieService.setUserType('email')
                  this.router.navigateByUrl('/account')
                },
                error: (error) => {
                  console.log(error)
                  this.errorHandler.setError('Ошибка регистрации', 5000)
                }
              })
          }
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Ошибка регистрации', 5000)
        }
      });
  }

  changePasswordUser() {
    if (this.changePasswordForm.invalid) return;
    this.authService.PUTupdateBaseData(this.currentJwtToken!, { password: this.changePasswordForm.value.newPassword! }, 'short', 'email')
      .subscribe({
        next: (value) => {
          console.log(value)
          this.changeTemplate('signin')
        },
        error: (error) => {
          console.log(error)
        }
      })
  }
  checkMatchCodes() {
    if (this.codeForm.value.code === this.currentChangeCode) {
      this.authService.POSTcreateShortJWT(this.requestChangeForm.value.email!)
        .subscribe({
          next: (value) => {
            console.log(value)
            this.currentJwtToken = value.jwtToken
            this.changeTemplate('changePassword')
          },
          error: (error) => {
            console.log(error)
          }
        })

    } else {
      this.errorHandler.setError('Неверный код', 2500)
    }
  }
}