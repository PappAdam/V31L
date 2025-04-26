import { inject, Injectable } from '@angular/core';
import {
  arrayToString,
  EncryptedMessage,
  PublicChatMember,
  PublicMessage,
  stringToCharCodeArray,
  UpdateChatMemberParams,
} from '@common';
import { AuthService, StoredUser } from './auth.service';
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
  private changedMasterKey = this.authService.masterKey$.subscribe((m) => {
    if (m) {
      this.updateChatKeys(undefined, m.hash, m.user);
    }
  });

  private changeKeyOnUserChange: Subscription = this.authService.user$
    .pipe(
      filter((user) => !!user),
      switchMap(async (user) => {
        await this.authService.importMasterWrapKey();
        await this.storeMasterPassword(user.mfaSuccess);

        // const keysStr = localStorage.getItem('keys');
        // if (keysStr) {
        //   const keys: { id: string; encKey: string }[] = JSON.parse(keysStr);
        //   const encKey = keys.find((k) => k.id == user.id)?.encKey;

        //   if (encKey) {
        //     try {
        //       const newKey = await this.unwrapKey(
        //         stringToCharCodeArray(encKey),
        //         this.authService.masterWrapKey!,
        //         'AES-KW'
        //       );
        //       this._privateKey$.next(newKey);
        //     } catch (error) {
        //       // Do nothing!
        //     }
        //   }
        // }
      })
    )
    .subscribe();

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
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const master = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: await this.hashText(masterKey),
        iterations: 100000,
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

  async hashText(str: string): Promise<Uint8Array<ArrayBufferLike>> {
    return new Uint8Array(
      await crypto.subtle.digest(
        { name: 'SHA-256' },
        stringToCharCodeArray(str)
      )
    );
  }

  async wrapKeyFrom(str: string) {
    const raw = new Uint8Array(
      await crypto.subtle.digest(
        { name: 'SHA-256' },
        stringToCharCodeArray(str)
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
    const wrapped = new Uint8Array(
      await crypto.subtle.wrapKey('raw', key, masterKey, {
        name: 'AES-KW',
      })
    );

    return wrapped;
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
      throw new Error('unwrapKey failed: ' + error);
    }
  }

  async updateChatKeys(
    newPassword: string | undefined,
    masterKey: string,
    user?: StoredUser
  ) {
    let usr;
    if (this.authService.user) {
      usr = this.authService.user;
    } else {
      usr = user!;
    }

    const chats = await lastValueFrom(
      this.http.get<PublicChatMember[]>('http://localhost:3000/chat/get', {
        headers: { Authorization: usr.token },
      })
    );

    const oldPrivateKey = await crypto.subtle.importKey(
      'raw',
      await this.keyToRaw(this.privateKey!),
      { name: 'AES-KW' },
      true,
      ['unwrapKey', 'wrapKey']
    );

    if (newPassword) {
      await this.authService.changeMasterWrapKey(newPassword);
    }
    await this.storeMasterPassword(masterKey);

    const updateParams: PublicChatMember[] = await Promise.all(
      chats.map(async (c) => {
        const rawKey = stringToCharCodeArray(c.key);
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
          headers: { Authorization: usr.token },
        }
      )
    );

    if (res.result == 'Error') {
      console.warn(res);
    }
  }

  async keyToRaw(key: CryptoKey) {
    return new Uint8Array(await crypto.subtle.exportKey('raw', key));
  }

  async generateChatKey() {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );

    return key;
  }
}
