import { inject, Injectable } from '@angular/core';
import {
  arrayToString,
  EncryptedMessage,
  PublicMessage,
  stringToCharCodeArray,
} from '@common';
import { AuthService } from './auth.service';
import {
  BehaviorSubject,
  filter,
  Observable,
  Subscription,
  switchMap,
} from 'rxjs';
import { ContentObserver } from '@angular/cdk/observers';

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
        await this.authService.importMasterWrapKey();

        // FIXME  this line isonly for debug purpuses, should be removed and only called, when a new user is logged in
        // Also the password parameter should be used, the default master key is 000000 for the debug users
        await this.storeMasterPassword();

        const keysStr = localStorage.getItem('keys');
        if (keysStr) {
          const keys: { id: string; encKey: string }[] = JSON.parse(keysStr);
          const encKey = keys.find((k) => k.id == user.id)?.encKey;

          if (encKey) {
            this._privateKey$.next(
              await this.unwrapKey(
                stringToCharCodeArray(encKey, Uint8Array),
                this.authService.masterWrapKey!,
                'AES-KW'
              )
            );
          }
        }
      })
    )
    .subscribe();

  /**
   *
   * @param password 6 digit pin converted to string
   */
  private async storeMasterPassword(password: string = '000000') {
    if (localStorage.getItem('keys')?.includes(this.authService.user?.id!)) {
      return;
    }

    const rawKey = await crypto.subtle.exportKey(
      'raw',
      this.authService.masterWrapKey!
    );

    const key = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const master = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: await this.rawKeyFrom(password),
        info: this.encoder.encode('info'),
      },
      key,
      { name: 'AES-KW', length: 256 },
      true,
      ['wrapKey', 'unwrapKey']
    );

    this._privateKey$.next(master);

    const wrapped = await this.wrapKey(master, this.authService.masterWrapKey!);

    const keys: { id: string; encKey: string }[] = JSON.parse(
      localStorage.getItem('keys')!
    );

    keys.push({
      id: this.authService.user?.id!,
      encKey: arrayToString(wrapped),
    });

    localStorage.setItem('keys', JSON.stringify(keys));
  }

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

  async rawKeyFrom(str: string): Promise<Uint8Array<ArrayBufferLike>> {
    return new Uint8Array(
      await crypto.subtle.digest(
        { name: 'SHA-256' },
        stringToCharCodeArray(str, Uint8Array)
      )
    );
  }

  async keyFrom(str: string) {
    const raw = new Uint8Array(
      await crypto.subtle.digest(
        { name: 'SHA-256' },
        stringToCharCodeArray(str, Uint8Array)
      )
    );

    return crypto.subtle.importKey('raw', raw, { name: 'AES-KW' }, true, [
      'wrapKey',
      'unwrapKey',
    ]);
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
    key: CryptoKey,
    masterKey: CryptoKey
  ): Promise<Uint8Array<ArrayBufferLike>> {
    return new Uint8Array(
      await crypto.subtle.wrapKey('raw', key, masterKey, {
        name: 'AES-KW',
      })
    );
  }

  async unwrapKey(
    wrappedKey: Uint8Array,
    masterKey: CryptoKey,
    method: 'AES-GCM' | 'AES-KW' = 'AES-GCM'
  ): Promise<CryptoKey> {
    try {
      const unwrapped = await crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        masterKey,
        { name: 'AES-KW' },
        { name: method },
        true,
        method == 'AES-GCM' ? ['encrypt', 'decrypt'] : ['wrapKey', 'unwrapKey']
      );

      return unwrapped;
    } catch (error) {
      console.error('Could not unwrap key:', error);
      throw new Error('Failed to unwrap key');
    }
  }
}
