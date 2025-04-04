import { Component, inject } from '@angular/core';
import { ChatCardComponent } from './components/chat-card/chat-card.component';
import { DirectsComponent } from './components/directs/directs.component';
import { GroupsComponent } from './components/groups/groups.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MessageService } from '@/services/message.service';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  map,
  startWith,
  tap,
} from 'rxjs';
import { FormControl } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { SearchBarComponent } from '@/components/search-bar/search-bar.component';
import { PlatformService } from '@/services/platform.service';
import { Router } from '@angular/router';
import { Chat } from '@/services/message.service';
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
  protected platformService = inject(PlatformService);

  chats$ = this.messageService.chats$;
  selectedChatIndex$ = this.messageService.selectedChatIndex$;
  messageControl = new FormControl('');
  searchControl$ = new FormControl('');

  filteredChats$ = combineLatest([
    this.chats$,
    this.searchControl$.valueChanges.pipe(startWith('')), // Handle initial value
  ]).pipe(
    map(([chats, keyword]) =>
      chats.filter((chat) =>
        chat.name!.toLowerCase().includes(keyword!.toLowerCase())
      )
    )
  );

  selectedChat$ = combineLatest([this.chats$, this.selectedChatIndex$]).pipe(
    map(([chats, index]) => chats[index])
  );

  constructor(private router: Router) {}

  navToChat(index: number) {
    this.messageService.selectedChatIndex = index;
    this.router.navigate(['/chat']);
  }
}
