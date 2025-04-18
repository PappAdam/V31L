import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EncryptionService } from './encryption.service';
import { AuthService } from './auth.service';
import {
  CreateSuccess,
  InviteError,
  ChatResponse,
  JoinSuccess,
  stringToCharCodeArray,
  ChatCreateSuccess,
} from '@common';
import { lastValueFrom } from 'rxjs';
import { MessageService } from './message.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InviteService {
  baseUrl: string = `${environment.httpUrl}/inv/`;
  http = inject(HttpClient);
  encryptionService = inject(EncryptionService);
  authService = inject(AuthService);
  messageService = inject(MessageService);

  sensitiveDataWarning = true;

  constructor() {}

  async wrapInvitation(invId: string): Promise<string> {
    const raw = Uint16Array.from(
      new Uint8Array(
        await crypto.subtle.exportKey(
          'raw',
          this.messageService.selectedChat.chatKey
        )
      )
    ).map((b) => b + 1);

    const key = String.fromCharCode(...raw);
    const inv = invId + key;

    return inv;
  }

  async unwrapInvitation(
    wrapped: string
  ): Promise<{ id: string; key: string }> {
    const id = wrapped.slice(0, 36);
    const key = String.fromCharCode(
      ...stringToCharCodeArray(
        wrapped.slice(36, wrapped.length),
        Uint16Array
      ).map((b) => b - 1)
    );

    return {
      id,
      key,
    };
  }

  /**
   * Creates a invitation for a given chat
   * {@link ChatResponse}
   */
  async createInvitation(chatId: string): Promise<string | null> {
    const body = { chatId };
    let result: string | null = null;
    try {
      const response = await lastValueFrom(
        this.http.post<CreateSuccess | InviteError>(
          this.baseUrl + 'create',
          body,
          {
            headers: { Authorization: this.authService.user!.token },
          }
        )
      );

      if (response.result == 'Success') {
        result = await this.wrapInvitation(response.invId);
      }
    } catch (error: any) {
      console.error(error.error);
    }

    return result;
  }

  /**
   *
   * @param invId Id of the recieved invitaiton
   * @param key AES-GCM key for decrypting and encrypting messages in chat
   */
  async sendJoinRequest(connectionString: string): Promise<JoinSuccess> {
    try {
      const invIdKeyPair = await this.unwrapInvitation(connectionString);
      const key = await crypto.subtle.importKey(
        'raw',
        stringToCharCodeArray(invIdKeyPair.key, Uint8Array),
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      const wrapped = await this.encryptionService.wrapKey(
        key,
        this.encryptionService.privateKey!
      );

      const body = {
        key: String.fromCharCode(...wrapped),
        invId: invIdKeyPair.id,
      };

      const response = await lastValueFrom(
        this.http.post<JoinSuccess>(this.baseUrl + 'join', body, {
          headers: { Authorization: this.authService.user!.token },
        })
      );

      return response;
    } catch (error: any) {
      return error.error;
    }
  }

  async createChatRequest(
    chatName: string
  ): Promise<ChatCreateSuccess & { key: CryptoKey }> {
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
      this.http.post<ChatCreateSuccess>(
        'http://localhost:3000/chat/create',
        body,
        {
          headers: { Authorization: this.authService.user!.token },
        }
      )
    );

    return { ...response, key };
  }
}
