import {
  effect,
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ImageResponse, stringToCharCodeArray } from '@common';
import { EncryptionService } from './encryption.service';

export type Image = { data: string };

@Injectable({
  providedIn: 'root',
})
export class ImgService {
  authService = inject(AuthService);
  encryptionService = inject(EncryptionService);
  http = inject(HttpClient);
  private baseURL = 'http://localhost:3000/img/';

  images = new Map<string, Image>();

  async createImage(img: string, key: CryptoKey) {
    const [imgtype, imgdata] = img.split(',');

    const body = {
      img: imgdata,
      type: imgtype,
      id: undefined,
      iv: undefined,
    };

    const res = await lastValueFrom(
      this.http.post<string | undefined>(this.baseURL + 'create', body, {
        headers: { Authorization: this.authService.user!.token },
      })
    );

    return res;
  }

  async storeImage(id: string, chatKey: CryptoKey): Promise<void> {
    if (!this.authService.user) {
      return;
    }

    if (this.images.has(id)) {
      return;
    }

    const response = await lastValueFrom(
      this.http.get<ImageResponse>(this.baseURL + id, {
        headers: { Authorization: this.authService.user.token },
      })
    );

    if (!response) {
      return;
    }

    let imgData = '';
    if (response.iv && chatKey) {
      const rawData = stringToCharCodeArray(atob(response.data), Uint8Array);
      imgData = await this.encryptionService.decryptText(chatKey, {
        data: rawData,
        iv: stringToCharCodeArray(response.iv, Uint8Array),
      });
    } else {
      imgData = response.data;
    }

    const img = `${response.type},${imgData}`;
    this.images.set(id, { data: img });
  }
}
