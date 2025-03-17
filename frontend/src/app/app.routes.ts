import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './login/auth.guard';
import { MfaVerifyComponent } from './login/mfa/verify/verify.component';
import { MfaSetupComponent } from './login/mfa/setup/setup.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login/mfa/setup', component: MfaSetupComponent },
  { path: 'login/mfa/verify', component: MfaVerifyComponent },
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/notfound' },
];
