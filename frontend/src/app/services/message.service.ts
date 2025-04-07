import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  merge,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import {
  arrayToString,
  PublicChat,
  PublicMessage,
  ServerChatsPackage,
  stringToCharCodeArray,
} from '@common';
import { EncryptionService, Message } from './encryption.service';
import { ImgService } from './img.service';

export type Chat = Omit<
  PublicChat,
  'encryptedMessages' | 'encryptedChatKey' | 'imgID'
> & {
  messages: Message[];
  chatKey: CryptoKey;
  img: string;
};

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  socketService = inject(SocketService);
  encryptionService = inject(EncryptionService);
  img = inject(ImgService);

  private _chats$ = new BehaviorSubject<Chat[]>([]);
  get chats$(): Observable<Chat[]> {
    return this._chats$.asObservable();
  }

  //#region Subscriptions - These subscriptions modify the _chats$ BehaviorSubject, they just show up as unused varibles, don't remove them.
  private loadOnAuthozition = this.socketService.authorized$.subscribe(
    (authorized) => {
      this._chats$.next([]);
      if (authorized) {
        this.socketService.createPackage({
          header: 'GetChats',
          chatCount: 10,
          messageCount: 20,
        });
      }
    }
  );

  private chatsPackageSubscription = this.socketService
    .addPackageListener('Chats')
    .subscribe((p) => this.onChatsPackageRecieved(p));

  private removeChatSubscription = this.socketService
    .addPackageListener('LeaveChat')
    .subscribe((p) =>
      this._chats$.next(
        this._chats$.value.filter((chat) => chat.id != p.chatId)
      )
    );
  //#endregion

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
      map(([messages, index]) => messages[index]),
      filter((chat) => !!chat)
    );
  }

  get selectedChat() {
    return this._chats$.value[this._selectedChatIndex$.value];
  }

  pinnedMessages$: Observable<Message[]> = merge(
    this.socketService.addPackageListener('PinnedMessages').pipe(
      switchMap((pkg) => {
        const messages = this.decryptAndParseMessages(
          pkg.messages,
          this.selectedChat.chatKey
        );
        return messages;
      })
    ),
    this.selectedChat$.pipe(
      tap((chat) => this.getPinnedMessages(chat.id)),
      map(() => [])
    )
  );

  async sendMessage(chatId: string, message: string) {
    const encrypted = await this.encryptionService.encryptText(
      this.selectedChat.chatKey,
      message
    );

    this.socketService.createPackage({
      header: 'NewMessage',
      chatId,
      messageContent: encrypted,
      type: 'Text',
    });
  }

  async sendImage(chatId: string, img: string) {
    const [imgtype, imgdata] = img.split(',');
    if (!imgdata) {
      console.error('Failed to send img. Sending its plain text data instead.');
      this.sendMessage(chatId, imgtype);
      return;
    }

    const encrypted = await this.encryptionService.encryptText(
      this.selectedChat.chatKey,
      imgdata
    );

    this.socketService.createPackage({
      header: 'NewMessage',
      chatId,
      messageContent: encrypted,
      type: 'Image',
      encoding: imgtype,
    });
  }

  pinMessage(messageId: string, pinState: boolean) {
    const chatId = this.selectedChat.id;
    this.socketService.createPackage(
      { header: 'PinMessage', messageId, pinState },
      () => {
        // Selected chat could change before acknowledgement, chatId must be determined outside the callback.
        this.getPinnedMessages(chatId);
      }
    );
  }

  getPinnedMessages(chatId: string) {
    this.socketService.createPackage({
      header: 'GetChatMessages',
      messageCount: -1,
      chatId,
      pinnedOnly: true,
    });
  }

  leaveChat(chatId: string) {
    this.socketService.createPackage({ header: 'LeaveChat', chatId });
  }

  onChatsPackageRecieved = async (pkg: ServerChatsPackage) => {
    pkg.chats.forEach(async (rawChatContent) => {
      let chatIndex = this._chats$.value.findIndex(
        (f) => f.id === rawChatContent.id
      );

      // Add the chat if it doesn't exist
      if (chatIndex < 0) {
        if (rawChatContent.encryptedChatKey) {
          const chatKey = await this.encryptionService.unwrapKey(
            rawChatContent.encryptedChatKey,
            this.encryptionService.privateKey
          );
          let img = '';
          if (rawChatContent.imgID) {
            img = (await this.img.getUrl(rawChatContent.imgID, chatKey)) || '';
          }

          const chat = {
            ...rawChatContent,
            chatKey,
            messages: [],
            img,
          };
          this._chats$.next([...this._chats$.value, chat]);
        } else {
          throw new Error('Failed to fetch the chat key.');
        }

        chatIndex = this._chats$.value.length - 1;
      }

      if (rawChatContent.encryptedMessages.length == 0) {
        return;
      }

      const chatMessages = await this.decryptAndParseMessages(
        rawChatContent.encryptedMessages,
        this._chats$.value[chatIndex].chatKey
      );

      if (
        this.lastMessageOfChat(rawChatContent.id) &&
        rawChatContent.encryptedMessages[0].timeStamp >
          this.lastMessageOfChat(rawChatContent.id)!.timeStamp
      ) {
        this._chats$.value[chatIndex].messages = [
          ...this._chats$.value[chatIndex].messages,
          ...chatMessages,
        ];
      } else {
        this._chats$.value[chatIndex].messages = [
          ...chatMessages,
          ...this._chats$.value[chatIndex].messages,
        ];
      }
    });
  };

  private async decryptAndParseMessages(
    messages: PublicMessage[],
    key: CryptoKey
  ): Promise<Message[]> {
    const chatMessages: Message[] = await Promise.all(
      messages.map(async (msg) => {
        let messageContent: string;
        if (msg.encryptedData.iv) {
          messageContent = await this.encryptionService.decryptText(
            key,
            msg.encryptedData
          );
        } else {
          messageContent = arrayToString(msg.encryptedData.data);
        }

        let type = msg.type;

        let img: string | undefined;
        if (msg.type == 'IMAGE') {
          img = await this.img.getUrl(messageContent, key);
        }

        if (!img && msg.type == 'IMAGE') {
          type = 'TEXT';
          messageContent = 'Failed to load img';
        } else if (img) {
          messageContent = img;
        }

        return {
          ...msg,
          content: messageContent,
          type,
        };
      })
    );

    return chatMessages;
  }

  lastMessageOfChat(chatId: string): Message | null {
    const chat = this._chats$.value.find((c) => c.id === chatId);
    return chat?.messages[chat.messages.length - 1] || null;
  }

  scrollLoadMessages(chatId: string) {
    const chat = this._chats$.value.find((c) => c.id === chatId);
    if (!chat) {
      return;
    }

    this.socketService.createPackage({
      header: 'GetChatMessages',
      chatId: chat.id,
      messageCount: 10,
      fromId: chat.messages[0].id,
    });
  }
}
