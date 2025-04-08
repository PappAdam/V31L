import { inject, Injectable } from '@angular/core';
import { EncryptedMessage, PublicMessage } from '@common';
import { AuthService } from './auth.service';
import {
  BehaviorSubject,
  filter,
  Observable, 
  Subscription,
  switchMap,
} from 'rxjs';

export type Message = Omit<PublicMessage, 'encryptedData'> & {
  content: string;
};

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  authService = inject(AuthService);
  encoder = new TextEncoder();
  decoder = new TextDecoder();

  _privateKey$ = new BehaviorSubject<CryptoKey | null>(null);

  // Do not remove, the subscription needs to run.
  private changeKeyOnUserChange: Subscription = this.authService.user$
    .pipe(
      filter((user) => !!user),
      switchMap(async (user) => {
        const encodedUserName = this.encoder.encode(user.username);

        const key = await crypto.subtle.digest('SHA-256', encodedUserName);

        this._privateKey$.next(
          await crypto.subtle.importKey('raw', key, { name: 'AES-KW' }, true, [
            'wrapKey',
            'unwrapKey',
          ])
        );
      })
    )
    .subscribe();

  get privateKey(): CryptoKey | null {
    return this._privateKey$.value;
  }

  get privateKey$(): Observable<CryptoKey | null> {
    return this._privateKey$.asObservable().pipe(filter((key) => !!key));
  }

  async encryptText(key: CryptoKey, text: string): Promise<EncryptedMessage> {
    try {
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
    } catch (error) {
      console.error('Failed to encrypt message', error);
      throw new Error('Failed to encrypt message');
    }
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
    try {
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
    } catch (error) {
      console.error('Could not unwrap key:', error);
      throw new Error('Failed to unwrap key');
    }
  }
}
