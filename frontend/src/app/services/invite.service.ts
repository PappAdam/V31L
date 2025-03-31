import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EncryptionService } from './encryption.service';
import { StoredUser } from './auth.service';
import {
  arrayToString,
  CreateSuccess,
  InviteError,
  InviteResponse,
  InviteSuccess,
  JoinSuccess,
} from '@common';
import { lastValueFrom } from 'rxjs';

export type InvIdKeyPair = {
  id: string;
  key: CryptoKey;
};

@Injectable({
  providedIn: 'root',
})
export class InviteService {
  baseUrl: string = 'http://localhost:3000/inv/';
  http = inject(HttpClient);
  enc = inject(EncryptionService);
  key!: CryptoKey;
  user: StoredUser;

  sensitiveDataWarning = true;

  constructor() {
    const rawUser = localStorage.getItem('user');
    this.user = JSON.parse(rawUser!);
    const encodedUserName = this.enc.encoder.encode(this.user.username);
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

  async wrapInvitation(invId: string): Promise<string> {
    const binKey = new Uint8Array(
      await crypto.subtle.exportKey('raw', this.key)
    );

    const key = arrayToString(binKey);
    const inv = invId + key;

    return inv;
  }

  /**
   * Creates a invitation for a given chat
   * {@link InviteResponse}
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
            headers: { Authorization: this.user.token },
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
  async sendJoinRequest(
    invId: string,
    key: CryptoKey
  ): Promise<JoinSuccess | InviteError> {
    try {
      const rawKey = await crypto.subtle.wrapKey('raw', key, this.key, {
        name: 'AES-KW',
      });

      const wrappedKey = String.fromCharCode(...new Uint8Array(rawKey));

      const body = { key: wrappedKey, invId };

      const response = await lastValueFrom(
        this.http.post<JoinSuccess | InviteError>(this.baseUrl + 'join', body, {
          headers: { Authorization: this.user.token },
        })
      );
      return response;
    } catch (error: any) {
      return error.error;
    }
  }
}
