import { Component } from '@angular/core';
import { ChatCardComponent } from './components/chat-card/chat-card.component';
import { DirectsComponent } from './components/directs/directs.component';
import { GroupsComponent } from './components/groups/groups.component';
import { MatTabsModule } from '@angular/material/tabs';
@Component({
  selector: 'app-messages',
  imports: [
    ChatCardComponent,
    DirectsComponent,
    GroupsComponent,
    MatTabsModule,
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent {}
