import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { PublicChat, PublicMessage, ServerChatsPackage } from '@common';
import { EncryptionService, Message } from './encryption.service';

export type Chat = Omit<PublicChat, 'encryptedMessages'> & {
  messages: Message[];
};

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  socketService = inject(SocketService);
  encryptionService = inject(EncryptionService);

  private _chats$ = new BehaviorSubject<Chat[]>([]);
  get chats$(): Observable<Chat[]> {
    return this._chats$.asObservable();
  }

  constructor() {
    this.socketService
      .addPackageListener('Chats')
      .subscribe(this.onChatsPackageRecieved);

    this.socketService.authorized$.subscribe((authorized) => {
      if (authorized) {
        this._chats$.next([]);
        this.socketService.createPackage({
          header: 'GetChats',
          chatCount: 10,
          messageCount: 20,
        });
      }
    });
  }

  lastMessage(chatId: string): Message | null {
    const chat = this._chats$.value.find((c) => c.id === chatId);
    return chat?.messages[chat.messages.length - 1] || null;
  }

  async sendMessage(chatId: string, message: string) {
    const encrypted = await this.encryptionService.encryptText(
      this.encryptionService.globalKey,
      message
    );

    this.socketService.createPackage({
      header: 'NewMessage',
      chatId,
      messageContent: encrypted,
    });
  }

  onChatsPackageRecieved = async (chatsPackage: ServerChatsPackage) => {
    chatsPackage.chats.forEach(async (rawChatContent) => {
      const chatIndex = this._chats$.value.findIndex(
        (f) => f.id === rawChatContent.id
      );

      const chatMessages: Message[] = await Promise.all(
        rawChatContent.encryptedMessages.map(async (msg) => {
          const messageContent = await this.encryptionService.decryptText(
            this.encryptionService.globalKey,
            msg.encryptedData
          );

          return {
            id: msg.id,
            user: msg.user,
            timeStamp: msg.timeStamp,
            content: messageContent,
          };
        })
      );

      const chatContent: Chat = {
        id: rawChatContent.id,
        name: rawChatContent.name,
        messages: chatMessages,
      };

      // Add the chat if it doesn't exist
      if (chatIndex < 0) {
        this._chats$.next([...this._chats$.value, chatContent]);
        return;
      }

      if (
        rawChatContent.encryptedMessages[0].timeStamp >
        this.lastMessage(rawChatContent.id)!.timeStamp
      ) {
        // Pushing new messages to the end of the array
        this._chats$.value[chatIndex].messages = [
          ...this._chats$.value[chatIndex].messages,
          ...chatContent.messages,
        ];
      } else {
        // Pushing new messages to the beginning of the array
        this._chats$.value[chatIndex].messages = [
          ...chatContent.messages,
          ...this._chats$.value[chatIndex].messages,
        ];
      }
    });
  };
}
