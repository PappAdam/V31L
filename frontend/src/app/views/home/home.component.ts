import { PlatformService } from '@/services/platform.service';
import { Component, inject } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { NavbarComponent } from './components/navbar/navbar.component';
@Component({
  selector: 'app-home',
  imports: [NavbarComponent],
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
