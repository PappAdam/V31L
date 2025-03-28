import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { PublicChat, PublicMessage, ServerChatsPackage } from '@common';
import { EncryptionService, Message } from './encryption.service';
import { InviteService } from './invite.service';

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
  encryptionService = inject(EncryptionService);
  invitationService = inject(InviteService);

  private _chats$ = new BehaviorSubject<Chat[]>([]);
  get chats$(): Observable<Chat[]> {
    return this._chats$.asObservable();
  }

  private _selectedChatIndex$ = new BehaviorSubject<number>(-1);
  get selectedChatIndex$(): Observable<number> {
    return this._selectedChatIndex$.asObservable();
  }

  get selectedChatIndex(): number {
    return this._selectedChatIndex$.value;
  }

  set selectedChatIndex(index: number) {
    this._selectedChatIndex$.next(index);
  }

  get selectedChat$() {
    return combineLatest([this.chats$, this.selectedChatIndex$]).pipe(
      map(([messages, index]) => messages[index])
    );
  }

  get selectedChat() {
    return this._chats$.value[this._selectedChatIndex$.value];
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
      let chatIndex = this._chats$.value.findIndex(
        (f) => f.id === rawChatContent.id
      );

      // Add the chat if it doesn't exist
      if (chatIndex < 0) {
        if (rawChatContent.encryptedChatKey) {
          const chatKey = await this.encryptionService.unwrapKey(
            rawChatContent.encryptedChatKey,
            this.invitationService.key
          );
          const chat = {
            ...rawChatContent,
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
