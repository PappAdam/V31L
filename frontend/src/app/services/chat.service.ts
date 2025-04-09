import { inject, Injectable } from '@angular/core';
import { ChatSuccess } from '@common';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  baseUrl: string = 'http://localhost:3000/chat/';
  encryptionService = inject(EncryptionService);
  authService = inject(AuthService);
  http = inject(HttpClient);

  async createChatRequest(
    chatName: string
  ): Promise<ChatSuccess & { key: CryptoKey }> {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );

    const wrappedKey = await this.encryptionService.wrapKey(
      key,
      this.encryptionService.privateKey!
    );

    const body = {
      name: chatName,
      key: String.fromCharCode(...wrappedKey),
      chatImgId: 'groupImg',
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

      await lastValueFrom(
        this.http.put(this.baseUrl, body, {
          headers: { Authorization: this.authService.user!.token },
        })
      );

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
