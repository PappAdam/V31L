import { PlatformService } from '@/services/platform.service';
import { Component, inject, Input } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MatButtonModule,
    MessageComponent,
    DetailsComponent,
    MatIconModule,
    MatRipple,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  @Input() chatTitle: string = '';
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);
  color = '#ffffff30';
  constructor() {
    this.platform = this.platformService.info;
  }
}
