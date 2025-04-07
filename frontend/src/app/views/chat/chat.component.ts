import { PlatformService } from '@/services/platform.service';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessageService } from '@/services/message.service';
import { firstValueFrom, take } from 'rxjs';
import { AsyncPipe, NgClass } from '@angular/common';
import { AuthService } from '@/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MatButtonModule,
    MessageComponent,
    DetailsComponent,
    MatIconModule,
    AsyncPipe,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected platformService: PlatformService = inject(PlatformService);
  platform: DeviceInfo | null = this.platformService.info;

  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);
  chats$ = this.messageService.chats$;
  selectedChatId$ = this.messageService.selectedChatId$;
  selectedChat$ = this.messageService.selectedChat$;
  message = '';

  @ViewChild('textInput') textInputDiv!: ElementRef<HTMLElement>;
  detailsState = 'closed';

  updateDetailsState(event: string) {
    this.detailsState = event;
  }

  sendOnEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  async sendMessage() {
    let message = this.textInputDiv.nativeElement.innerText;
    if (!message || this.messageService.selectedChatId == '') return;
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.messageService.sendMessage(selectedChat!.id, message);
    this.textInputDiv.nativeElement.innerText = '';
  }
}
