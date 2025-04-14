import { inject, Injectable } from '@angular/core';
import {
  arrayToString,
  EncryptedMessage,
  PublicChatMember,
  PublicMessage,
  stringToCharCodeArray,
  UpdateChatMemberParams,
} from '@common';
import { AuthService } from './auth.service';
import {
  BehaviorSubject,
  filter,
  lastValueFrom,
  Observable,
  Subscription,
  switchMap,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';

export type Message = Omit<PublicMessage, 'encryptedData'> & {
  content: string;
};

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  authService = inject(AuthService);
  http = inject(HttpClient);
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  masterKey: string = '';

  _privateKey$ = new BehaviorSubject<CryptoKey | null>(null);

  // Do not remove, the subscription needs to run.
  private changeKeyOnUserChange: Subscription = this.authService.user$
    .pipe(
      filter((user) => !!user),
      switchMap(async (user) => {
        await this.authService.importMasterWrapKey();

        const keysStr = localStorage.getItem('keys');
        if (keysStr) {
          const keys: { id: string; encKey: string }[] = JSON.parse(keysStr);
          const encKey = keys.find((k) => k.id == user.id)?.encKey;

          if (encKey) {
            console.log('asd');
            const newKey = await this.unwrapKey(
              stringToCharCodeArray(encKey, Uint8Array),
              this.authService.masterWrapKey!,
              'AES-KW'
            );
            console.log('asd2');
            this._privateKey$.next(newKey);
          }
        }
      })
    )
    .subscribe();

  /**
   *
   * @param masterKey 6 digit pin converted to string
   */
  public async storeMasterPassword(masterKey: string = '000000') {
    const keys: { id: string; encKey: string }[] = JSON.parse(
      localStorage.getItem('keys')!
    );
    const userIndex = keys.findIndex((k) => k.id == this.authService.user?.id);
    if (userIndex != -1) {
      keys.splice(userIndex, 1);
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
        salt: await this.rawKeyFrom(masterKey),
        info: this.encoder.encode('info'),
      },
      key,
      { name: 'AES-KW', length: 256 },
      true,
      ['wrapKey', 'unwrapKey']
    );

    this._privateKey$.next(master);

    const wrapped = await this.wrapKey(master, this.authService.masterWrapKey!);

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

  async updateChatKeys(newPassword: string, masterKey: string = '000000') {
    const chats = await lastValueFrom(
      this.http.get<PublicChatMember[]>('http://localhost:3000/chat/get', {
        headers: { Authorization: this.authService.user!.token },
      })
    );

    const oldPrivateKey = this.privateKey!;
    await this.authService.changeMasterWrapKey(newPassword);
    await this.storeMasterPassword(masterKey);

    const updateParams: PublicChatMember[] = await Promise.all(
      chats.map(async (c) => {
        const rawKey = stringToCharCodeArray(c.key, Uint8Array);
        const chatKey = await this.unwrapKey(rawKey, oldPrivateKey);

        const newWrapped = await this.wrapKey(chatKey, this.privateKey!);

        return {
          id: c.id,
          key: arrayToString(newWrapped),
        };
      })
    );

    const body: UpdateChatMemberParams = {
      chatMembers: updateParams,
    };

    const res = await lastValueFrom(
      this.http.put<{ result: string }>(
        'http://localhost:3000/chat/update',
        body,
        {
          headers: { Authorization: this.authService.user!.token },
        }
      )
    );

    if (res.result == 'Error') {
      console.warn(res);
    }
  }
}
