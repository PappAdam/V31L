import { PlatformService } from '@/services/platform.service';
import { Component, inject } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AddComponent } from './views/add/add.component';
import { SearchComponent } from './views/search/search.component';
import { MessageComponent } from '../chat/components/message/message.component';
import { SettingsComponent } from './views/settings/settings.component';
import { MessagesComponent } from './views/messages/messages.component';

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, MessagesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor() {
    this.platform = this.platformService.info;
  }
}
