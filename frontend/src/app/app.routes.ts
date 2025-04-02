import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { platformGuard } from './guards/platform.guard';
import { LayoutComponent } from './layout/layout.component';
import { MfaVerifyComponent } from './login/mfa/verify/verify.component';
import { MfaSetupComponent } from './login/mfa/setup/setup.component';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './views/home/views/settings/settings.component';
import { SearchComponent } from './views/home/views/search/search.component';
import { MessagesComponent } from './views/home/views/messages/messages.component';
import { AddComponent } from './views/home/views/add/add.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { ChatComponent } from './views/chat/chat.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login/mfa/setup', component: MfaSetupComponent },
  { path: 'login/mfa/verify', component: MfaVerifyComponent },
  {
    path: '',
    redirectTo: '/(home:messages)', // Redirect to /(home:messages)
    pathMatch: 'full',
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, platformGuard],

    children: [
      { path: 'messages', component: MessagesComponent, outlet: 'home' },
      { path: 'settings', component: SettingsComponent, outlet: 'home' },
      { path: 'search', component: SearchComponent, outlet: 'home' },
      { path: 'add', component: AddComponent, outlet: 'home' },
      { path: 'chat', component: ChatComponent, outlet: 'home' },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
