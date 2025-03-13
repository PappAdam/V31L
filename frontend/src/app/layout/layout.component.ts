import { PlatformService } from '@/services/platform.service';
import { Component, inject } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';

@Component({
  selector: 'app-layout',
  imports: [],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor() {
    this.platform = this.platformService.info;
  }
}
