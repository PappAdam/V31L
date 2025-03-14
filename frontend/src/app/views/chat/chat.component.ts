import { PlatformService } from '@/services/platform.service';
import { Component, inject, Input } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormField } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MessageComponent,
    DetailsComponent,
    MatInputModule,
    MatFormField,
    MatFormFieldModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  @Input() chatTitle: string = '';
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor() {
    this.platform = this.platformService.info;
  }
}
