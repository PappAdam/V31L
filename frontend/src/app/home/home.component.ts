import { Component, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../services/http/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { SocketService } from '../services/socket/socket.service';
import { ChatMessage, ServerSyncResponsePackage } from '../../../../types';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  selectedChat: string = '';
  selectedChatIndex: number = -1;
  chatMessages: ChatMessage[] = [];
  messageControl = new FormControl('');

  constructor(
    private socketService: SocketService,
    public authService: AuthService
  ) {}

  async ngOnInit() {
    this.socketService.addPackageListener(
      'SyncResponse',
      (pkg: ServerSyncResponsePackage) => {
        pkg.chatMessages.forEach((chatmsg) => {
          const chatIndex = this.chatMessages.findIndex(
            (f) => f.chat.id === chatmsg.chat.id
          );
          if (chatIndex < 0) {
            this.chatMessages.push(chatmsg);
          } else {
            this.chatMessages[chatIndex].messages = [
              ...this.chatMessages[chatIndex].messages,
              ...chatmsg.messages,
            ];
          }
        });

        if (this.chatMessages.length > 0 && !this.selectedChat) {
          this.selectedChat = this.chatMessages[0].chat.id;
          this.selectedChatIndex = 0;
        }
        this.scrollToBottom();
      }
    );

    this.socketService.addPackageListener('NewMessage', (pkg) => {
      this.chatMessages
        .find((chatMessage) => chatMessage.chat.id == pkg.chatId)
        ?.messages.push({
          id: 'TODO',
          chatId: pkg.chatId,
          content: pkg.messageContent,
          timeStamp: new Date(),
          username: pkg.username,
        });
    });
  }

  get selectedChatMessages() {
    return (
      this.chatMessages.find((cm) => cm.chat.id === this.selectedChat)
        ?.messages || []
    );
  }

  selectChat(id: string) {
    this.selectedChat = id;
    this.selectedChatIndex = this.chatMessages.findIndex(
      (ch) => ch.chat.id == id
    );
  }

  sendMessage() {
    const message = this.messageControl.value?.trim();
    if (!message || !this.selectedChat) return;

    this.socketService.createPackage({
      header: 'NewMessage',
      chatId: this.selectedChat,
      messageContent: message,
    });
    this.messageControl.reset();
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  // isOwnMessage(username: string): boolean {
  //   return username === this.authService.tok;
  // }
}
