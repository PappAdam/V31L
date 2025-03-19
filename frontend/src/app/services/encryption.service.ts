import { Injectable } from '@angular/core';
import { EncryptedMessage, PublicMessage } from '@common';

export type Message = Omit<PublicMessage, 'encryptedData'> & {
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  constructor() {}

  async encryptText(key: CryptoKey, text: string): Promise<EncryptedMessage> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv,
      },
      key,
      this.encoder.encode(text)
    );

    return {
      data: encrypted,
      iv,
    };
  }

  async decryptText(
    key: CryptoKey,
    encrypted: EncryptedMessage
  ): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: encrypted.iv,
      },
      key,
      encrypted.data
    );

    return this.decoder.decode(decrypted);
  }
}
