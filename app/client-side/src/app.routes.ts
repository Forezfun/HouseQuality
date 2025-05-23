import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page.component';
import { AccountPageComponent } from './components/account-page/account-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { PlanHousePageComponent } from './components/plan-house-page/plan-house-page.component';
import { CreateFurniturePageComponent } from './components/create-furniture-page/create-furniture-page.component';
import { ShopPageComponent } from './components/shop-page/shop-page.component';

export const routes: Routes = [
    { component: MainPageComponent, path: '' },
    { component: AccountPageComponent, path: 'account' },
    { component: LoginPageComponent, path: 'login' },
    { component: PlanHousePageComponent, path: 'plan' },
    { component: PlanHousePageComponent, path: 'plan/:planId' },
    { component: PlanHousePageComponent, path: 'plan/:planId/:roomId' },
    { component: PlanHousePageComponent, path: 'plan/:planId/:roomId/:furnitureCardId' },
    { component: CreateFurniturePageComponent, path: 'create/:id' },
    { component: ShopPageComponent, path: 'shop', data: { pageName: 'shop' } },
    { component: ShopPageComponent, path: 'shop/:category', data: { pageName: 'shop' }},
    { component: ShopPageComponent, path: 'shop/:category/:furnitureCardId', data: { pageName: 'shop' } },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
