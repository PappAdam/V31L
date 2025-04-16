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
import {
  arrayToString,
  EncryptedMessage,
  ImageResponse,
  stringToCharCodeArray,
} from '@common';
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

  private images = new Map<string, Image>();

  img(id: string) {
    return this.images.get(id)?.data;
  }

  imgRef(id: string) {
    return this.images.get(id);
  }

  async createImage(img: string, key?: CryptoKey) {
    let [imgtype, imgdata] = img.split(',');
    let iv: string | undefined;

    imgdata = atob(imgdata);
    if (key) {
      const encrypted = await this.encryptionService.encryptText(key, imgdata);
      imgdata = arrayToString(encrypted.data);
      iv = arrayToString(encrypted.iv!);
    }

    const body = {
      img: imgdata,
      type: imgtype,
      id: undefined,
      iv,
    };

    const res = await lastValueFrom(
      this.http.post<string | undefined>(this.baseURL + 'create', body, {
        headers: { Authorization: this.authService.user!.token },
      })
    );

    if (res) {
      await this.storeImage(res, key);
    }

    return res;
  }

  async storeImage(id: string, chatKey?: CryptoKey): Promise<void> {
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

    let imgData = response.data;
    if (response.iv && chatKey) {
      const rawData = stringToCharCodeArray(atob(response.data), Uint8Array);
      imgData = btoa(
        await this.encryptionService.decryptText(chatKey, {
          data: rawData,
          iv: stringToCharCodeArray(response.iv, Uint8Array),
        })
      );
    }
    const img = `${response.type},${imgData}`;
    this.images.set(id, { data: img });
  }
}
