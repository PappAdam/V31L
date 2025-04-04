import { PlatformService } from '@/services/platform.service';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { Chat, MessageService } from '@/services/message.service';
import {
  combineLatest,
  firstValueFrom,
  map,
  Subscription,
  take,
  tap,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '@/services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
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
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected platformService: PlatformService = inject(PlatformService);
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);

  @Input() chatTitle: string = '';
  @ViewChild('msgsWrapper') msgsWrapper?: ElementRef;
  topScrollOffset = 0;

  platform: DeviceInfo | null = this.platformService.info;
  detailsState = 'closed';

  selectedChat$ = this.messageService.selectedChat$;

  messageControl = new FormControl('');
  private subscription!: Subscription;

  ngOnInit() {
    this.subscription = this.selectedChat$.subscribe(this.selectedChatChanged);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onScroll() {
    const elem = this.msgsWrapper!.nativeElement as HTMLDivElement;
    this.topScrollOffset = elem.scrollHeight - elem.scrollTop;
    if (elem.scrollTop < 50) {
      this.messageService.scrollLoadMessages(
        this.messageService.selectedChat.id
      );

      // elem.scrollTo({
      //   top:
      // });
    }
  }

  updateDetailsState(event: string) {
    this.detailsState = event;
  }

  selectedChatChanged = (chat: Chat) => {
    const elem = this.msgsWrapper?.nativeElement as HTMLDivElement;
    if (elem) {
      elem.scrollTop = elem.scrollHeight;
    }
  };

  async sendMessage() {
    const message = this.messageControl.value?.trim();
    if (!message || this.messageService.selectedChatIndex == -1) return;
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.messageService.sendMessage(selectedChat.id, message);
    this.messageControl.reset();
  }
}
