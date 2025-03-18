import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { platformGuard } from './guards/platform.guard';
import { LayoutComponent } from './layout/layout.component';
import { MfaVerifyComponent } from './login/mfa/verify/verify.component';
import { MfaSetupComponent } from './login/mfa/setup/setup.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login/mfa/setup', component: MfaSetupComponent },
  { path: 'login/mfa/verify', component: MfaVerifyComponent },
  {
    path: '',
    component: LayoutComponent,
    pathMatch: 'full',
    canActivate: [authGuard, platformGuard],
  },
  { path: '**', redirectTo: '/notfound' },
];
