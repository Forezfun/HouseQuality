import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page/main-page.component';
import { AccountPageComponent } from './components/account-page/account-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { PlanHouseComponent } from './components/plan-house/plan-house/plan-house.component';
import { SceneComponent } from './components/scene/scene.component';
 
export const routes: Routes = [
    {component:MainPageComponent,path:''},
    {component:AccountPageComponent,path:'account'},
    {component:LoginPageComponent,path:'login'},
    {component:PlanHouseComponent,path:'plan'},
    {component:SceneComponent,path:'scene'}
];
