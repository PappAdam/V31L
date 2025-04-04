import { PlatformService } from '@/services/platform.service';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
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
    MatInputModule,
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
  selectedChatId$ = this.messageService.selectedChatId$;
  selectedChat$ = combineLatest([this.chats$, this.selectedChatId$]).pipe(
    map(
      ([chats, id]) => chats.find((chat) => chat.id === id) // Ensure type consistency
    )
  );
  message = '';
  previousUser = '';
  @ViewChild('textInput') textInputDiv!: ElementRef<HTMLElement>;
  constructor() {
    this.platform = this.platformService.info;

    this.selectedChatId$
      .pipe(
        tap((id) => {
          this.onSelectedIdChanged(id);
        })
      )
      .subscribe();
  }
  onSelectedIdChanged(id: string) {
    console.log(id);
  }
  updateDetailsState(event: string) {
    this.detailsState = event;
  }

  updatePreviousUser(username: string) {
    this.previousUser = username;
  }

  sendOnEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  async sendMessage() {
    let message = this.textInputDiv.nativeElement.innerText;
    if (!message || this.messageService.currentSelectedChatId() == '') return;
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.messageService.sendMessage(selectedChat!.id, message);
    this.textInputDiv.nativeElement.innerText = '';
  }
}
