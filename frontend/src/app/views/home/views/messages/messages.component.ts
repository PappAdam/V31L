import { Component, inject } from '@angular/core';
import { ChatCardComponent } from './components/chat-card/chat-card.component';
import { DirectsComponent } from './components/directs/directs.component';
import { GroupsComponent } from './components/groups/groups.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MessageService } from '@/services/message.service';
import { BehaviorSubject, combineLatest, first, map, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { SearchBarComponent } from '@/components/search-bar/search-bar.component';
@Component({
  selector: 'app-messages',
  imports: [
    ChatCardComponent,
    DirectsComponent,
    SearchBarComponent,
    GroupsComponent,
    MatTabsModule,
    AsyncPipe,
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent {
  protected messageService = inject(MessageService);

  chats$ = this.messageService.chats$;
  selectedChatIndex$ = this.messageService.selectedChatIndex$;

  selectedChat$ = combineLatest([this.chats$, this.selectedChatIndex$]).pipe(
    map(([messages, index]) => messages[index])
  );

  messageControl = new FormControl('');

  constructor() {}
}
