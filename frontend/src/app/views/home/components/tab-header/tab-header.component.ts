import { PlatformService } from '@/services/platform.service';
import { Component, inject, Input, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DeviceInfo } from '@capacitor/device';

@Component({
  selector: 'app-tab-header',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './tab-header.component.html',
  styleUrl: './tab-header.component.scss',
})
export class TabHeaderComponent {
  @Input() Title: string = '';
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor(private router: Router) {
    this.platform = this.platformService.info;
  }

  Back(): void {
    this.router.navigate(['/app', { outlets: { home: 'messages' } }]);
  }
}
