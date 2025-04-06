import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { PublicChat, PublicMessage, ServerChatsPackage } from '@common';
import { EncryptionService, Message } from './encryption.service';
import { InviteService } from './invite.service';
import { FalseEncryptionService } from './false-encryption.service';

export type Chat = Omit<
  PublicChat,
  'encryptedMessages' | 'encryptedChatKey'
> & {
  messages: Message[];
  chatKey: CryptoKey;
};

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  socketService = inject(SocketService);
  encryptionService = inject(FalseEncryptionService);
  invitationService = inject(InviteService);

  private _chats$ = new BehaviorSubject<Chat[]>([]);
  get chats$(): Observable<Chat[]> {
    return this._chats$.asObservable();
  }

  private _selectedChatId$ = new BehaviorSubject<string>('');
  get selectedChatId$(): Observable<string> {
    return this._selectedChatId$.asObservable();
  }

  currentSelectedChatId(): string {
    return this._selectedChatId$.getValue();
  }

  set selectedChatId(index: string) {
    this._selectedChatId$.next(index);
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
      this._chats$.value.find((c) => c.id == this.selectedChatId)?.chatKey,
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
      let chatIndex = this._chats$.value.findIndex(
        (f) => f.id === rawChatContent.id
      );

      const chatContext: Omit<Chat, 'chatKey' | 'messages'> = {
        id: rawChatContent.id,
        name: rawChatContent.name,
      };

      // Add the chat if it doesn't exist
      if (chatIndex < 0) {
        if (rawChatContent.encryptedChatKey) {
          const chatKey = await this.encryptionService.unwrapKey(
            rawChatContent.encryptedChatKey,
            this.invitationService.key
          );
          const chat = {
            ...chatContext,
            chatKey,
            messages: [],
          };
          this._chats$.next([...this._chats$.value, chat]);
        } else {
          throw new Error('Failed to fetch the chat key.');
        }

        chatIndex = this._chats$.value.length - 1;
      }

      const chatMessages: Message[] = await Promise.all(
        rawChatContent.encryptedMessages.map(async (msg) => {
          console.log('chatMessage branch ran');

          const messageContent = await this.encryptionService.decryptText(
            this._chats$.value[chatIndex].chatKey,
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

      if (
        this.lastMessage(rawChatContent.id) &&
        rawChatContent.encryptedMessages[0].timeStamp >
          this.lastMessage(rawChatContent.id)!.timeStamp
      ) {
        console.log('Thethingthat i tryied rlat time ran');
        // Pushing new messages to the end of the array
        this._chats$.value[chatIndex].messages = [
          ...this._chats$.value[chatIndex].messages,
          ...chatMessages,
        ];
      } else {
        // Pushing new messages to the beginning of the array
        this._chats$.value[chatIndex].messages = [
          ...chatMessages,
          ...this._chats$.value[chatIndex].messages,
        ];
      }
    });
  };
}
