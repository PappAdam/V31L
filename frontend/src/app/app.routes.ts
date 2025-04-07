import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { platformGuard } from './guards/platform.guard';
import { LayoutComponent } from './layout/layout.component';
import { MfaSetupComponent } from './login/mfa/setup/setup.component';
import { SettingsComponent } from './views/home/views/settings/settings.component';
import { SearchComponent } from './views/home/views/search/search.component';
import { MessagesComponent } from './views/home/views/messages/messages.component';
import { AddComponent } from './views/home/views/add/add.component';
import { NotFoundComponent } from './views/not-found/not-found.component';

export const routes: Routes = [
  // Primary outlet routes (unnamed)
  { path: 'login', component: LoginComponent },
  { path: 'login/mfa/setup', component: MfaSetupComponent },

  // Named outlet routes
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, platformGuard],
    children: [
      {
        path: 'messages',
        component: MessagesComponent,
        outlet: 'home',
      },
      {
        path: 'settings',
        component: SettingsComponent,
        outlet: 'home',
      },
      {
        path: 'search',
        component: SearchComponent,
        outlet: 'home',
      },
      {
        path: 'add',
        component: AddComponent,
        outlet: 'home',
      },
    ],
  },

  // Fallback route
  { path: '**', component: NotFoundComponent },
];
