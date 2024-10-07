import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page/main-page.component';
import { AccountPageComponent } from './components/account-page/account-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { SceneComponent } from './components/scene/scene.component';
import { PlanHousePageComponent } from './components/plan-house-page/plan-house-page.component';
import { CreateFurniturePageComponent } from './components/create-furniture-page/create-furniture-page.component';
 
export const routes: Routes = [
    {component:MainPageComponent,path:''},
    {component:AccountPageComponent,path:'account'},
    {component:LoginPageComponent,path:'login'},
    {component:PlanHousePageComponent,path:'plan'},
    {component:CreateFurniturePageComponent,path:'create/:id'},
    {component:SceneComponent,path:'scene'}
];
