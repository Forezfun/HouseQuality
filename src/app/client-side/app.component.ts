import { Component, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SceneComponent } from './components/scene/scene.component';
import { CreateFurnitureComponent } from './components/create-furnitre/create-furniture.component';
import { furnitureData } from './components/create-furnitre/create-furniture.component';
import { PlanHouseComponent } from './components/plan-house/plan-house/plan-house.component';
import { roomData } from './components/plan-house/plan-house/plan-house.component';
import { ViewFurnitureComponent } from './components/view-furniture/view-furniture.component';
import { ErrorHandlerComponent } from './components/error-handler/error-handler/error-handler.component';
import { AccountService } from './services/account.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { UserCookieService } from './services/user-cookie.service';
import { ServerImageControlService } from './services/server-image-control.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,SceneComponent,CreateFurnitureComponent,PlanHouseComponent,ViewFurnitureComponent,ErrorHandlerComponent,HttpClientModule],
  providers:[ErrorHandlerComponent,AccountService,AuthService,UserCookieService,ServerImageControlService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'HouseQuality';
 
}
