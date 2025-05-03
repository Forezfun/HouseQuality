import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { NavigationPanelComponent } from '../navigation-panel/navigation-panel.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { accountChangeBaseData, accountChangeSecondaryData, accountFullInformation, AccountService, userType } from '../../services/account.service';
import { FormGroup, ReactiveFormsModule, FormControl, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserCookieService } from '../../services/user-cookie.service';
import { ServerImageControlService } from '../../services/server-image-control.service';
import { ClientImageControlService } from '../../services/client-image-control.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [NavigationPanelComponent, NgFor, NgIf, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements AfterViewInit, OnInit {
  userData?: accountFullInformation & { furnitureCards: any[] };
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
    private errorHandler: ErrorHandlerService
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

  private loadUserData(jwt: string): void {
    this.userService.GETuser(jwt).subscribe({
      next: (response) => {
        const responseData = (response as any).userData;
        this.userData = {
          email: responseData.email,
          nickname: responseData.nickname,
          projects: responseData.projects,
          avatarUrl: this.imageServerControlService.GETuserAvatar(jwt),
          furnitureCards: this.processFurnitureCards(responseData.furnitureCards)
        };

        if (responseData.password !== undefined) {
          this.userData.password = responseData.password;
        }
      },
      error: (error) => {
        console.error(error);
        this.errorHandler.setError('Ошибка загрузки данных пользователя', 5000);
      }
    });
  }

  private processFurnitureCards(furnitureCards: any[]): any[] {
    return furnitureCards.map(furnitureData => ({
      furnitureCardId: furnitureData._id,
      name: furnitureData.name,
      previewUrl: this.imageServerControlService.GETmainImage(
        furnitureData._id,
        furnitureData.colors[0].color
      )
    }));
  }

  private initEditForm(): void {
    this.editForm = new FormGroup({
      nickname: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ])
    });
    
    console.log(this.userCookieService.getUserType())
    if (this.userCookieService.getUserType() === 'email') {
      this.editForm.addControl('password', new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]));
    }
  }

  async uploadAvatar(event: Event): Promise<void> {
    const jwt = this.userCookieService.getJwt();
    if (!jwt) return;

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await this.imageClientControlService.compressImage(file);
      if (!compressedImage) return;

      this.imageServerControlService.POSTloadUserAvatar(compressedImage, jwt).subscribe({
        next: () => {
          if (this.userData) {
            this.userData.avatarUrl = URL.createObjectURL(compressedImage);
          }
        },
        error: (error) => {
          console.error(error);
          this.errorHandler.setError('Ошибка загрузки аватара', 5000);
        }
      });
    } catch (error) {
      console.error(error);
      this.errorHandler.setError('Ошибка обработки изображения', 5000);
    }
  }

  openEditForm(): void {
    if (!this.userData) return;
    
    this.editForm.patchValue({
      nickname: this.userData.nickname,
      ...(this.userData.password !== undefined && { password: '' })
    });
    
    this.isEditFormOpen = true;
  }

  closeEditForm(): void {
    this.isEditFormOpen = false;
    this.editForm.reset();
  }

  saveChanges(): void {
    if (!this.userData || !this.editForm.valid) return;
    
    const jwt = this.userCookieService.getJwt();
    const userType = this.userCookieService.getUserType() as userType;
    if (!jwt || !userType) return;

    this.updateSecondaryData(jwt, userType);
    this.updateBaseDataIfNeeded(jwt, userType);
    
    this.closeEditForm();
  }

  private updateSecondaryData(jwt: string, userType: userType): void {
    const changes: accountChangeSecondaryData = { 
      nickname: this.editForm.value.nickname 
    };

    this.userService.PUTupdateSecondaryInformation(jwt, changes, userType).subscribe({
      next: () => {
        if (this.userData) {
          this.userData.nickname = changes.nickname;
        }
      },
      error: (error) => {
        console.error(error);
        this.errorHandler.setError('Ошибка обновления данных', 5000);
      }
    });
  }

  private updateBaseDataIfNeeded(jwt: string, userType: userType): void {
    if (this.userData?.password === undefined || !this.editForm.value.password) return;

    const changes: accountChangeBaseData = { 
      password: this.editForm.value.password 
    };

    this.authService.PUTupdateBaseData(jwt, changes, 'long', userType).subscribe({
      next: () => {
        if (this.userData) {
          this.userData.password = changes.password;
        }
      },
      error: (error) => {
        console.error(error);
        this.errorHandler.setError('Ошибка обновления пароля', 5000);
      }
    });
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

