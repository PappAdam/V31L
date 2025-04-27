import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { platformGuard, androidGuard } from './guards/platform.guard';
import { LayoutComponent } from './layout/layout.component';
import { MfaSetupComponent } from './login/mfa/setup/setup.component';
import { SettingsComponent } from './views/home/views/settings/settings.component';
import { MessagesComponent } from './views/home/views/messages/messages.component';
import { AddComponent } from './views/home/views/add/add.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { ChatComponent } from './views/chat/chat.component';

export const routes: Routes = [
  // Primary outlet routes (unnamed)
  { path: 'login', component: LoginComponent, canActivate: [platformGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [androidGuard] },
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard, platformGuard],
    children: [
      { path: 'messages', component: MessagesComponent, outlet: 'home' },
      { path: 'settings', component: SettingsComponent, outlet: 'home' },
      { path: 'add', component: AddComponent, outlet: 'home' },
    ],
  },

  // Fallback route
  { path: '**', component: NotFoundComponent },
];
