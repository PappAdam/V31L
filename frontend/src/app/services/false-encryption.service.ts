import { Injectable } from '@angular/core';
import { EncryptedMessage, PublicMessage } from '@common';
import { StoredUser } from './auth.service';

export type Message = Omit<PublicMessage, 'encryptedData'> & {
  content: string;
};

@Injectable({
  providedIn: 'root',
})
export class FalseEncryptionService {
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  privateKey!: string;
  user: StoredUser;

  constructor() {
    const rawUser = localStorage.getItem('user');
    this.user = JSON.parse(rawUser!);
    const encodedUserName = this.encoder.encode(this.user.username);
    this.privateKey = 'Pretty secure thingy thing.';
  }

  async encryptText(key: any, text: string): Promise<EncryptedMessage> {
    return {
      data: this.encoder.encode(text),
      iv: new Uint8Array(12),
    };
  }

  async decryptText(key: any, encrypted: EncryptedMessage): Promise<string> {
    return this.decoder.decode(encrypted.data);
  }

  async wrapKey(
    chatKey: any,
    masterKey: any
  ): Promise<Uint8Array<ArrayBufferLike>> {
    return new Uint8Array(40);
  }

  async unwrapKey(wrappedKey: any, masterKey: any): Promise<any> {
    return 'Dont care dont no, private key things.';
  }
}
