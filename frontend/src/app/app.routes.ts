import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { AppLayoutComponent } from './app-layout/app-layout.component';
import { platformGuard } from './guards/platform.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppLayoutComponent,
    pathMatch: 'full',
    canActivate: [authGuard, platformGuard],
  },
  { path: '**', redirectTo: '/notfound' },
];
