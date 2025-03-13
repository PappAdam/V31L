import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { platformGuard } from './guards/platform.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    pathMatch: 'full',
    canActivate: [authGuard, platformGuard],
  },
  { path: '**', redirectTo: '/notfound' },
];
