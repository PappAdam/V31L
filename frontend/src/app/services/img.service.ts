import { effect, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { arrayToString, ImageResponse, stringToCharCodeArray } from '@common';
import { EncryptionService } from './encryption.service';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root',
})
export class ImgService {
  authService = inject(AuthService);
  encryptionService = inject(EncryptionService);
  http = inject(HttpClient);
  baseURL = 'http://localhost:3000/img/';

  async getUrl(id: string, chatKey: CryptoKey): Promise<string | undefined> {
    if (!this.authService.user) {
      return;
    }

    const response = await lastValueFrom(
      this.http.get<ImageResponse>(this.baseURL + id, {
        headers: { Authorization: this.authService.user.token },
      })
    );

    if (!response) {
      return undefined;
    }

    let imgData = '';
    if (response.iv) {
      const rawData = stringToCharCodeArray(atob(response.data), Uint8Array);
      imgData = await this.encryptionService.decryptText(chatKey, {
        data: rawData,
        iv: stringToCharCodeArray(response.iv, Uint8Array),
      });
    } else {
      imgData = response.data;
    }

    return `${response.type},${imgData}`;
  }
}
