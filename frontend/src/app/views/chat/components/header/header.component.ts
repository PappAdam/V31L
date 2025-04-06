import { MessageService } from '@/services/message.service';
import { PlatformService } from '@/services/platform.service';
import { Component, Output, EventEmitter, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DeviceInfo } from '@capacitor/device';
import { combineLatest, lastValueFrom, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ImgService } from '@/services/img.service';
@Component({
  selector: 'app-header',
  imports: [MatIconModule, AsyncPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor() {
    this.platform = this.platformService.info;
  }

  state: string = 'closed';
  @Output() detailsStateEvent = new EventEmitter<string>();
  platform: DeviceInfo | null = null;

  platformService: PlatformService = inject(PlatformService);
  protected messageService = inject(MessageService);

  chats$ = this.messageService.chats$;
  selectedChatIndex$ = this.messageService.selectedChatIndex$;

  selectedChat$ = combineLatest([this.chats$, this.selectedChatIndex$]).pipe(
    map(([messages, index]) => messages[index])
  );

  ctor() {
    this.platform = this.platformService.info;
  }

  async openDetails() {
    if (this.state == 'closed') {
      this.state = 'open';
    } else {
      this.state = 'closed';
    }

    this.detailsStateEvent.emit(this.state);
  }
}
