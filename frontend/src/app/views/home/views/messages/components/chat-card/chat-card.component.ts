import { AuthService } from '@/services/auth.service';
import { Message } from '@/services/encryption.service';
import { ImgService } from '@/services/img.service';
import { Chat, MessageService } from '@/services/message.service';
import { Component, inject, Input } from '@angular/core';
import { PublicChat } from '@common';

@Component({
  selector: 'app-chat-card',
  imports: [],
  templateUrl: './chat-card.component.html',
  styleUrl: './chat-card.component.scss',
})
export class ChatCardComponent {
  @Input() unread: string = '0';
  @Input() chat?: Chat;
  @Input() status: string = '';
  @Input() selected: boolean = false;

  get lastMessage() {
    if (!this.chat || !this.chat.messages.length) {
      return '';
    }

    return this.chat.messages[this.chat.messages.length - 1].content;
  }
}
