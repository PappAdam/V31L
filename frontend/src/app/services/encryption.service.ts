import { Injectable } from '@angular/core';
import { EncryptedMessage, MessageType, PublicMessage } from '@common';
import { StoredUser } from './auth.service';
import { User } from './message.service';

export type Message = Omit<PublicMessage, 'encryptedData'> & {
  content: string;
};

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  privateKey!: CryptoKey;
  user: StoredUser;

  constructor() {
    const rawUser = localStorage.getItem('user');
    this.user = JSON.parse(rawUser!);
    const encodedUserName = this.encoder.encode(this.user.username);

    crypto.subtle
      .digest('SHA-256', encodedUserName)
      .then(
        async (key) =>
          (this.privateKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-KW' },
            true,
            ['wrapKey', 'unwrapKey']
          ))
      );
  }

  async encryptText(key: CryptoKey, text: string): Promise<EncryptedMessage> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      this.encoder.encode(text)
    );

    return {
      data: new Uint8Array(encrypted),
      iv,
    };
  }

  async decryptText(
    key: CryptoKey,
    encrypted: EncryptedMessage
  ): Promise<string> {
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: encrypted.iv },
        key,
        encrypted.data
      );

      return this.decoder.decode(decrypted);
    } catch (error) {
      console.error(error);
      return 'Failed to decrypt message';
    }
  }

  async wrapKey(
    chatKey: CryptoKey,
    masterKey: CryptoKey
  ): Promise<Uint8Array<ArrayBufferLike>> {
    return new Uint8Array(
      await crypto.subtle.wrapKey('raw', chatKey, masterKey, {
        name: 'AES-KW',
      })
    );
  }

  async unwrapKey(
    wrappedKey: Uint8Array,
    masterKey: CryptoKey
  ): Promise<CryptoKey> {
    const unwrapped = await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      masterKey,
      { name: 'AES-KW' },
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );

    return unwrapped;
  }
}
