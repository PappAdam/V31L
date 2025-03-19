import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EncryptionService } from './encryption.service';
import { StoredUser } from './auth.service';
import { InviteResponse, InviteSuccess } from '@common';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InviteService {
  baseUrl: string = 'http://localhost:3000/inv/';
  http = inject(HttpClient);
  enc = inject(EncryptionService);
  key!: CryptoKey;

  constructor() {
    const rawUser = localStorage.getItem('user');
    const user: StoredUser = JSON.parse(rawUser!);
    const encodedUserName = this.enc.encoder.encode(user.username);
    // TODO use real keys, randomly generated
    crypto.subtle
      .digest('SHA-256', encodedUserName)
      .then(
        async (key) =>
          (this.key = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-KW' },
            true,
            ['wrapKey', 'unwrapKey']
          ))
      );
  }

  /**
   * Creates a invitation for a given chat
   * @returns {Promise<InviteResponse>}
   * {@link InviteResponse}
   */
  async createInvitation(chatId: string): Promise<InviteResponse> {
    const body = { chatId };
    try {
      const response = await lastValueFrom(
        this.http.post<InviteResponse>(this.baseUrl + 'create', body)
      );
      return response;
    } catch (error: any) {
      return error.error;
    }
  }

  /**
   *
   * @param invId Id of the recieved invitaiton
   * @param key AES-GCM key for decrypting and encrypting messages in chat
   */
  async sendJoinRequest(
    invId: string,
    key: CryptoKey
  ): Promise<InviteResponse> {
    try {
      const wrappedKey = await crypto.subtle.wrapKey('raw', key, this.key, {
        name: 'AES-KW',
      });

      const body = { key: new Uint8Array(wrappedKey), invId };
      const response = await lastValueFrom(
        this.http.post<InviteResponse>(this.baseUrl + 'join', body)
      );
      return response;
    } catch (error: any) {
      return error.error;
    }
  }
}
