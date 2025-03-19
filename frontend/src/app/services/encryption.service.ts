import { Injectable } from '@angular/core';
import { EncryptedMessage, PublicMessage } from '@common';

export type Message = Omit<PublicMessage, 'encryptedData'> & {
  content: string;
};

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  globalKey!: CryptoKey;
  constructor() {
    // TODO GLOBAL KEY SHOULD NOT BE USED
    crypto.subtle
      .importKey('raw', new Uint8Array(32), { name: 'AES-GCM' }, true, [
        'encrypt',
        'decrypt',
      ])
      .then(async (key) => {
        this.globalKey = key;
        let raw = await crypto.subtle.exportKey('raw', key);

        console.warn(
          'GLOBAL KEY IS BEING USED FOR DEVELOPMENT!\nDEV KEY: ',
          new Uint8Array(raw, 0, 32).toString()
        );
      });
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

      console.log(decrypted);

      return this.decoder.decode(decrypted);
    } catch {
      return 'An error occured during encryption. ♫ For give me, my father. For all the sins. ♫ :(';
    }
  }
}
