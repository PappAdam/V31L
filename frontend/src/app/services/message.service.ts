import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { PublicChat, PublicMessage, ServerChatsPackage } from '@common';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  socketService = inject(SocketService);

  private _chats$ = new BehaviorSubject<PublicChat[]>([]);
  get chats$(): Observable<PublicChat[]> {
    return this._chats$.asObservable();
  }

  private _selectedChatIndex$ = new BehaviorSubject<number>(-1);
  get selectedChatIndex$(): Observable<number> {
    return this._selectedChatIndex$.asObservable();
  }

  currentSelectedChatIndex(): number {
    return this._selectedChatIndex$.value;
  }

  set selectedChatIndex(index: number) {
    this._selectedChatIndex$.next(index);
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

  lastMessage(chatId: string): PublicMessage | null {
    const chat = this._chats$.value.find((c) => c.id === chatId);
    return chat?.messages[chat.messages.length - 1] || null;
  }

  sendMessage(chatId: string, messageContent: string) {
    this.socketService.createPackage({
      header: 'NewMessage',
      chatId,
      messageContent,
    });
  }

  onChatsPackageRecieved = (chatsPackage: ServerChatsPackage) => {
    chatsPackage.chats.forEach((chatContent) => {
      const chatIndex = this._chats$.value.findIndex(
        (f) => f.id === chatContent.id
      );

      // Add the chat if it doesn't exist
      if (chatIndex < 0) {
        this._chats$.next([...this._chats$.value, chatContent]);
        return;
      }

      if (
        chatContent.messages[0].timeStamp >
        this.lastMessage(chatContent.id)!.timeStamp
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
