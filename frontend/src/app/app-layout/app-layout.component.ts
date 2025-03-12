import { PlatformService } from '@/services/platform.service';
import { Component, inject } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';

@Component({
  selector: 'app-app-layout',
  imports: [],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor() {
    this.platform = this.platformService.info;
  }
}
