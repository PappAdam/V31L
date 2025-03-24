import { PlatformService } from '@/services/platform.service';
import { Component, inject, Input } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { MessageService } from '@/services/message.service';
import { combineLatest, firstValueFrom, map, take, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '@/services/auth.service';
import { FormControl } from '@angular/forms';
@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MatButtonModule,
    MessageComponent,
    DetailsComponent,
    MatIconModule,
    MatRipple,
    AsyncPipe,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  @Input() chatTitle: string = '';
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);
  color = '#ffffff30';
  detailsState = 'closed';
  protected messageService = inject(MessageService);

  protected authService = inject(AuthService);
  chats$ = this.messageService.chats$;
  selectedChatIndex$ = this.messageService.selectedChatIndex$;
  selectedChat$ = combineLatest([this.chats$, this.selectedChatIndex$]).pipe(
    map(([messages, index]) => messages[index])
  );
  messageControl = new FormControl('');

  previousUser = '';

  constructor() {
    this.platform = this.platformService.info;

    this.selectedChatIndex$
      .pipe(
        tap((index) => {
          this.onSelectedIndexChanged(index);
        })
      )
      .subscribe();
  }
  onSelectedIndexChanged(index: number) {
    console.log(index);
  }
  updateDetailsState(event: string) {
    this.detailsState = event;
  }

  updatePreviousUser(username: string) {
    this.previousUser = username;
  }

  async sendMessage() {
    const message = this.messageControl.value?.trim();
    if (!message || this.messageService.currentSelectedChatIndex() == -1)
      return;
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.messageService.sendMessage(selectedChat.id, message);
    this.messageControl.reset();
  }
}
