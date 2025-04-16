import { inject, Injectable } from '@angular/core';
import { ChatSuccess } from '@common';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';
import { HttpClient } from '@angular/common/http';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  baseUrl: string = 'http://localhost:3000/chat/';
  encryptionService = inject(EncryptionService);
  socketService = inject(SocketService);
  authService = inject(AuthService);
  http = inject(HttpClient);

  async createChatRequest(
    chatName: string,
    key: CryptoKey,
    imgID?: string
  ): Promise<ChatSuccess & { key: CryptoKey }> {
    const wrappedKey = await this.encryptionService.wrapKey(
      key,
      this.encryptionService.privateKey!
    );

    const body = {
      name: chatName,
      key: String.fromCharCode(...wrappedKey),
      chatImgId: imgID || 'groupImg',
    };

    const response = await lastValueFrom(
      this.http.post<ChatSuccess>(this.baseUrl, body, {
        headers: { Authorization: this.authService.user!.token },
      })
    );

    return { ...response, key };
  }

  async updateChatRequest(
    chatId: string,
    data: {
      chatName?: string;
      chatImgId?: string;
    }
  ): Promise<boolean> {
    try {
      const body = {
        chatId,
        name: data.chatName,
        chatImgId: data.chatImgId,
      };

      const res = await lastValueFrom(
        this.http.put(this.baseUrl, body, {
          headers: { Authorization: this.authService.user!.token },
          observe: 'response',
        })
      );

      if (res.status == 200) {
        this.socketService.createPackage({
          header: 'RefreshChat',
          chat: {
            id: chatId,
            name: data.chatName,
            imgID: data.chatImgId,
          },
        });
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
