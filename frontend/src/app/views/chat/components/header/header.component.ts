import { PlatformService } from '@/services/platform.service';
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DeviceInfo } from '@capacitor/device';
@Component({
  selector: 'app-header',
  imports: [MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  state: string = 'closed';
  @Output() detailsStateEvent = new EventEmitter<string>();
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);
  constructor() {
    this.platform = this.platformService.info;
  }

  openDetails() {
    if (this.state == 'closed') {
      this.state = 'open';
    } else {
      this.state = 'closed';
    }

    this.detailsStateEvent.emit(this.state);
  }
}
