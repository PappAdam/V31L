import { Component } from '@angular/core';
import { ChatCardComponent } from './components/chat-card/chat-card.component';
import { DirectsComponent } from './components/directs/directs.component';
import { GDSwitchComponent } from './components/gdswitch/gdswitch.component';
import { GroupsComponent } from './components/groups/groups.component';
@Component({
  selector: 'app-messages',
  imports: [
    ChatCardComponent,
    DirectsComponent,
    GDSwitchComponent,
    GroupsComponent,
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent {}
