import { Component, inject } from '@angular/core';
import { TabHeaderComponent } from '../../components/tab-header/tab-header.component';
import { PlatformService } from '@/services/platform.service';
import { DeviceInfo } from '@capacitor/device';

@Component({
  selector: 'app-add',
  imports: [TabHeaderComponent],
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss',
})
export class AddComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor() {
    this.platform = this.platformService.info;
  }
}
