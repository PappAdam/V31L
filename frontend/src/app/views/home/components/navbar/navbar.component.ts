import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { PlatformService } from '@/services/platform.service';
import { DeviceInfo } from '@capacitor/device';

export interface ActiveTab {
  index: number;
  name: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected platformService: PlatformService = inject(PlatformService);
  platform: DeviceInfo | null = this.platformService.info;
  tabs_urls = ['settings', 'messages', 'add'];
  tabs_icons = ['settings', 'message', 'add'];
}
