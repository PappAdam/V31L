import { effect, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ImageResponse } from '@common';

@Injectable({
  providedIn: 'root',
})
export class ImgService {
  authService = inject(AuthService);
  http = inject(HttpClient);
  baseURL = 'http://localhost:3000/img/';

  async getUrl(id: string): Promise<string | undefined> {
    if (!this.authService.user) {
      return;
    }

    const response = await lastValueFrom(
      this.http.get<ImageResponse>(this.baseURL + id, {
        headers: { Authorization: this.authService.user.token },
      })
    );

    return response;
  }
}
