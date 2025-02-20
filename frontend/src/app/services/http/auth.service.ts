import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SocketService } from '../socket/socket.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/auth/';
  private _token: string | null = null;
  public get token(): string | null {
    return this._token;
  }

  constructor(private http: HttpClient, private socket: SocketService) {}

  async login(username: string, password: string) {
    const body = {
      username,
      password,
    };
    const loginRequest = this.http.post<LoginResponse>(
      this.baseUrl + 'login',
      body
    );
    const res = await firstValueFrom(loginRequest);
    await this.retrieveToken(res);
  }

  async register(username: string, password: string) {
    const body = {
      username,
      password,
    };
    const registerRequest = this.http.post<LoginResponse>(
      this.baseUrl + 'register',
      body
    );
    const res = await firstValueFrom(registerRequest);

    await this.retrieveToken(res);
  }

  async retrieveToken(res: LoginResponse) {
    this._token = res.token;
    this.socket.connect(this._token);
  }
}

interface LoginResponse {
  message: string;
  token: string;
}
