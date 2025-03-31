import { Message } from '@/services/encryption.service';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-card',
  imports: [],
  templateUrl: './chat-card.component.html',
  styleUrl: './chat-card.component.scss',
})
export class ChatCardComponent {
  @Input() unread: string = '0';
  @Input() name: string = '';
  @Input() lastMsg?: Message;
  @Input() status: string = '';
  @Input() selected: string = '';
}
