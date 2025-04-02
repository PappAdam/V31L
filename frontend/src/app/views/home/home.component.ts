import { PlatformService } from '@/services/platform.service';
import { Component, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MessagesComponent } from './views/messages/messages.component';
import { NavigationService, Target } from '@/services/navigation.service';
import { NavigationOutletDirectiveDirective } from '@/directives/navigation-outlet-directive.directive';
import { AfterViewInit } from '@angular/core';
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
export class HomeComponent implements AfterViewInit {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);
  navigationService: NavigationService = inject(NavigationService);
  inital = true;
  @ViewChild('navOutlet', { read: ViewContainerRef })
  container!: ViewContainerRef;

  constructor() {
    this.platform = this.platformService.info;
  }
  ngAfterViewInit(): void {
    this.navigationService.registerParent(Target.home, this.container, {
      initialPage: MessagesComponent,
    });
  }
}
