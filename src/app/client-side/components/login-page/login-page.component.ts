import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { AccountService, accountBaseInformation, accountSignInData } from '../../services/account.service';
import { UserCookieService } from '../../services/user-cookie.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../../services/error-handler.service';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [NavigationPanelComponent, ReactiveFormsModule, NgTemplateOutlet, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements AfterViewInit, OnInit {
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: AccountService,
    private userCookieService: UserCookieService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) { }

  @ViewChild('signup', { read: TemplateRef }) private signupTemplate!: TemplateRef<any>
  @ViewChild('signin', { read: TemplateRef }) private signinTemplate!: TemplateRef<any>
  @ViewChild('code', { read: TemplateRef }) codeTemplate!: TemplateRef<any>
  @ViewChild('changePassword', { read: TemplateRef }) changePasswordTemplate!: TemplateRef<any>
  currentFormTemplate!: TemplateRef<any>
  loginModuleElement!: HTMLSpanElement
  scrollBtn!: HTMLButtonElement
  backgroundHouseElement!: HTMLImageElement
  scrollTimeout: any = null;
  inputValues: string[] = new Array(4).fill('');
  signupForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    nickname: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [Validators.required]),
  });
  codeForm = new FormGroup({
    code: new FormControl<string>('', [Validators.required, Validators.minLength(4)])
  });
  changePasswordForm = new FormGroup({
    newPassword: new FormControl<string>('', [Validators.required]),
    repeatPassword: new FormControl<string>('', [Validators.required]),
  });

  ngOnInit(): void {
    if (this.userService.checkJwt()) this.router.navigateByUrl('/account')
  }
  ngAfterViewInit(): void {
    this.scrollBtn = this.elementRef.nativeElement.querySelector('.scrollBtn')
    this.loginModuleElement = this.elementRef.nativeElement.querySelector('.loginModule')
    this.currentFormTemplate = this.signinTemplate;
    this.backgroundHouseElement = this.elementRef.nativeElement.querySelector('.houseBackground')
    this.changeDetectorRef.detectChanges()
  }


  onInput(currentInput: HTMLInputElement, nextInput: HTMLInputElement | null) {
    this.codeForm.patchValue({
      code: this.inputValues.join('')
    });

    if (nextInput && currentInput.value) {
      nextInput.focus();
    }
  }
  changeTemplate(nameTemplate: string) {
    this.renderer.addClass(this.loginModuleElement, 'changeTemplateAnimation')
    setTimeout(() => { this.renderer.removeClass(this.loginModuleElement, 'changeTemplateAnimation') }, 1000)
    setTimeout(() => {
      switch (nameTemplate) {
        case 'code':
          this.currentFormTemplate = this.codeTemplate
          break
        case 'signin':
          this.currentFormTemplate = this.signinTemplate
          break
        case 'signup':
          this.currentFormTemplate = this.signupTemplate
          break
        case 'changePassword':
          this.currentFormTemplate = this.changePasswordTemplate
          break
      }

    }, 500)
  }
  onBackspace(currentInput: HTMLInputElement, previousInput: HTMLInputElement | null) {
    if (!currentInput.value && previousInput) {
      previousInput.focus();
    }
    this.codeForm.patchValue({
      code: this.inputValues.join('')
    });
  }
  checkLoginModuleStatus() {
    if (!this.loginModuleElement) return false
    return this.loginModuleElement.classList.contains('disabledOpacity') ? false : true
  }
  signinForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required]),
  });
  toggleScroll() {
    this.checkLoginModuleStatus() ? this.scrollToUpPage() : this.scrollToDownPage()
  }
  scrollToDownPage() {
    window.scrollTo({
      top: document.documentElement.scrollHeight - window.innerHeight,
      behavior: 'smooth'
    });
  }
  scrollToUpPage() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  signinUser() {
    const signInValue = this.signinForm.value as accountSignInData
    this.authService.POSTcreateLongJWT(signInValue, 'email')
      .subscribe({
        next: (response) => {
          this.userCookieService.setJwt((response as { jwt: string }).jwt, 'long')
          this.userCookieService.setUserType('email')
          this.router.navigateByUrl('/account')
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while logging in', 5000)
        }
      })
  }
  signUpUser() {
    const signUpValue = this.signupForm.value as accountBaseInformation
    this.userService.POSTcreateUser(signUpValue, 'email')
      .subscribe({
        next: (response) => {
          this.authService.POSTcreateLongJWT({
            email: signUpValue.email,
            password: signUpValue.password!
          }, 'email')
            .subscribe({
              next: (response) => {
                this.userCookieService.setJwt((response as { jwt: string }).jwt, 'long')
                this.router.navigateByUrl('account')
              },
              error: (error) => {
                console.log(error)
                this.errorHandler.setError('Error while signing up', 5000)
              }
            })
        },
        error: (error) => {
          console.log(error)
          this.errorHandler.setError('Error while signing up', 5000)
        }
      })
  }

  @HostListener('document:scroll', ['$event'])
  onWindowScroll() {
    if (this.scrollTimeout) return
    this.scrollTimeout = setTimeout(() => {
      const scrollPosition = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      this.renderer.setStyle(this.backgroundHouseElement, 'opacity', Math.max(Math.abs(scrollPosition * 2 / windowHeight - 1), 0.35));

      if (scrollPosition >= (document.documentElement.scrollHeight - window.innerHeight) / 2) {
        this.renderer.removeClass(this.loginModuleElement, 'disabledOpacity');
        this.scrollTimeout = null;
        return;
      }

      if (scrollPosition <= 50) {
        this.renderer.setStyle(this.scrollBtn, 'z-index', 4);
      } else {
        this.renderer.setStyle(this.scrollBtn, 'z-index', 3);
      }

      if (!this.loginModuleElement.classList.contains('disabledOpacity')) {
        this.renderer.addClass(this.loginModuleElement, 'disabledOpacity');
      }

      this.scrollTimeout = null;
    }, 100);
  }
}
