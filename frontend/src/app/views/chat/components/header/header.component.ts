import { Chat, MessageService } from '@/services/message.service';
import { PlatformService } from '@/services/platform.service';
import {
  Component,
  Output,
  EventEmitter,
  inject,
  Input,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DeviceInfo } from '@capacitor/device';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'app-header',
  imports: [MatIconModule, AsyncPipe, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(private router: Router) {
    this.platform = this.platformService.info;
  }

  detailsState: 'open' | 'closed' = 'closed';
  @Output() detailsStateEvent = new EventEmitter<'open' | 'closed'>();
  platform: DeviceInfo | null = null;

  platformService: PlatformService = inject(PlatformService);
  protected messageService = inject(MessageService);

  chats$ = this.messageService.chats$;
  selectedChat$ = this.messageService.selectedChat$;

  ctor() {
    this.platform = this.platformService.info;
  }

  async openDetails() {
    if (this.detailsState == 'closed') {
      this.detailsState = 'open';
    } else {
      this.detailsState = 'closed';
    }

    this.detailsStateEvent.emit(this.detailsState);
  }

  goBack() {
    this.router.navigate(['/app', { outlets: { home: 'messages' } }]);
  }
}
