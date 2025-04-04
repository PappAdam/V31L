import { Chat, MessageService } from '@/services/message.service';
import { PlatformService } from '@/services/platform.service';
import { Component, Output, EventEmitter, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DeviceInfo } from '@capacitor/device';
import { combineLatest, map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
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

  state: string = 'closed';
  @Output() detailsStateEvent = new EventEmitter<string>();
  platform: DeviceInfo | null = null;

  platformService: PlatformService = inject(PlatformService);
  protected messageService = inject(MessageService);

  chats$ = this.messageService.chats$;
  selectedChatId$ = this.messageService.selectedChatId$;

  selectedChat$: Observable<Chat | undefined> = combineLatest([
    this.chats$,
    this.selectedChatId$,
  ]).pipe(
    map(
      ([chats, id]) => chats.find((chat) => chat.id === id) // ✅ Implicit return
    )
  );

  ctor() {
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

  goBack() {
    this.router.navigate(['/side', { outlets: { home: 'messages' } }]);
  }
}
