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

  constructor() {
    this.socketService
      .addPackageListener('Chats')
      .subscribe(this.onChatContentPackageRecieved);
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

  onChatContentPackageRecieved = (chatsPackage: ServerChatsPackage) => {
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
