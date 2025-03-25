import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-card',
  imports: [],
  templateUrl: './chat-card.component.html',
  styleUrl: './chat-card.component.scss',
})
export class ChatCardComponent {
  @Input() unread: string = '0';
  @Input({ required: true }) name: string = '';
  @Input({ required: true }) last_msg: string = '';
  @Input() status: string = '';
  @Input() selected: string = '';
}
