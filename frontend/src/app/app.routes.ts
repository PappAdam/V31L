import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './login/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/notfound' },
];
