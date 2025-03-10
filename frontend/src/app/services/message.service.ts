import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PublicChatContent,
  PublicMessage,
  ServerChatContentPackage,
} from '@common';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  socketService = inject(SocketService);

  private _messages$ = new BehaviorSubject<PublicChatContent[]>([]);
  get messages$(): Observable<PublicChatContent[]> {
    return this._messages$.asObservable();
  }

  constructor() {
    this.socketService
      .addPackageListener('ChatContent')
      .subscribe(this.onChatContentPackageRecieved);
  }

  lastMessage(chatId: string): PublicMessage | null {
    const chat = this._messages$.value.find((c) => c.chat.id === chatId);
    return chat?.messages[chat.messages.length - 1] || null;
  }

  sendMessage(chatId: string, messageContent: string) {
    this.socketService.createPackage({
      header: 'NewMessage',
      chatId,
      messageContent,
    });
  }

  onChatContentPackageRecieved = (
    chatContentPackage: ServerChatContentPackage
  ) => {
    chatContentPackage.chatMessages.forEach((chatContent) => {
      const chatIndex = this._messages$.value.findIndex(
        (f) => f.chat.id === chatContent.chat.id
      );

      // Add the chat if it doesn't exist
      if (chatIndex < 0) {
        this._messages$.next([...this._messages$.value, chatContent]);
        return;
      }

      if (
        chatContent.messages[0].timeStamp >
        this.lastMessage(chatContent.chat.id)!.timeStamp
      ) {
        // Pushing new messages to the end of the array
        this._messages$.value[chatIndex].messages = [
          ...this._messages$.value[chatIndex].messages,
          ...chatContent.messages,
        ];
      } else {
        // Pushing new messages to the beginning of the array
        this._messages$.value[chatIndex].messages = [
          ...chatContent.messages,
          ...this._messages$.value[chatIndex].messages,
        ];
      }
    });
  };
}
