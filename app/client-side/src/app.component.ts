import { Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SceneComponent } from './components/scene/scene.component';
import { PlanHouseComponent } from './components/plan-house/plan-house.component';
import { NotificationComponent } from './components/notification/notification.component';
import { AccountService } from './services/account.service';
import { AuthService } from './services/auth.service';
import { AccountCookieService } from './services/account-cookie.service';
import { ServerImageControlService } from './services/server-image-control.service';
import { ProjectService } from './services/project.service';
import { FurnitureCardControlService } from './services/furniture-card-control.service';
import { FurnitureModelControlService } from './services/furniture-model-control.service';
import { ShopService } from './services/shop.service';
import { FinderService } from './services/finder.service';
import { AutoHeightDirective } from './directives/auto-height.directive';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,NotificationComponent],
  providers:[AutoHeightDirective,NotificationComponent,AccountService,AuthService,AccountCookieService,ServerImageControlService,ProjectService,PlanHouseComponent,SceneComponent,FurnitureCardControlService,FurnitureModelControlService,ShopService,FinderService,Location],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'HouseQuality'; 
}
