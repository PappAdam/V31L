import { PlatformService } from '@/services/platform.service';
import { Component, inject } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  platformService: PlatformService = inject(PlatformService);
  platform: DeviceInfo | null = this.platformService.info;
}
