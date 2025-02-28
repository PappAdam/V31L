import { Component } from '@angular/core';
import { AuthService } from '../services/http/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { SocketService } from '../services/socket/socket.service';
import { ChatMessage, ServerSyncResponsePackage } from '../../../../types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  title = 'message_app';
  selectedChat: string = '';
  selectedChatIndex: number = -1;
  chatMessages: ChatMessage[] = [];

  constructor(
    private socketService: SocketService,
    protected authService: AuthService
  ) {}

  async ngOnInit() {
    this.socketService.packageSender.addPackageListener(
      'SyncResponse',
      (pkg) => {
        pkg.chatMessages.forEach((chatmsg) => {
          const chatIndex = this.chatMessages.findIndex(
            (f) => f.chat.id === chatmsg.chat.id
          );
          if (chatIndex < 0) {
            this.chatMessages.push(chatmsg);
          } else {
            let messages = this.chatMessages[chatIndex].messages;
            messages = messages.concat(chatmsg.messages);
          }
        });

        console.log(pkg);

        this.selectedChatIndex = 0;
        this.selectedChat = this.chatMessages[0].chat.id;
      }
    );
  }

  async sendClicked() {
    if (this.authService.token) {
      let text = (
        document.querySelector('input[type=text]') as HTMLInputElement
      ).value;

      throw new Error(
        'Sending messages is not available because ChatId is not implemented yet.'
      );
      // this.socketService.sendMessage(text, CHATID HERE);
    }
  }
}
