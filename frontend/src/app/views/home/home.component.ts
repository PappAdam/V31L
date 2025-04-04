import { PlatformService } from '@/services/platform.service';
import { Component, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MessagesComponent } from './views/messages/messages.component';
import { NavigationOutletDirectiveDirective } from '@/directives/navigation-outlet-directive.directive';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [
    NavbarComponent,
    MessagesComponent,
    NavigationOutletDirectiveDirective,
    RouterOutlet,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);
  inital = true;
  @ViewChild('navOutlet', { read: ViewContainerRef })
  container!: ViewContainerRef;

  constructor() {
    this.platform = this.platformService.info;
  }
}
