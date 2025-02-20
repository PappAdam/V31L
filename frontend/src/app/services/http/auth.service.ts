import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SocketService } from '../socket/socket.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/auth/';
  private _token: string | null = null;
  public get token(): string | null {
    return this._token;
  }

  constructor(
    private http: HttpClient,
    private socket: SocketService,
    private router: Router
  ) {
    this._token = localStorage.getItem('jwt');
  }

  async login(username: string, password: string) {
    const body = {
      username,
      password,
    };
    const loginRequest = this.http.post<AuthResponse>(
      this.baseUrl + 'login',
      body
    );
    const res = await firstValueFrom(loginRequest);
    await this.onSuccessfulAuth(res.token);
  }

  async register(username: string, password: string) {
    const body = {
      username,
      password,
    };
    const registerRequest = this.http.post<AuthResponse>(
      this.baseUrl + 'register',
      body
    );
    const res = await firstValueFrom(registerRequest);

    await this.onSuccessfulAuth(res.token);
  }

  async refreshToken() {
    if (!this._token) {
      return null;
    }

    const loginRequest = this.http.post<{ token: string }>(
      this.baseUrl + 'refresh',
      {},
      { headers: { Authorization: this._token } }
    );
    const res = await firstValueFrom(loginRequest);
    this.onSuccessfulAuth(res.token);
    return res.token;
  }

  async onSuccessfulAuth(token: string) {
    this._token = token;
    localStorage.setItem('jwt', token);
    this.socket.connect(token);
  }

  logout() {
    console.log('asd');

    this._token = null;
    localStorage.removeItem('jwt');
    //Disconnect socket connection
    this.router.navigateByUrl('/login');
  }
}

interface AuthResponse {
  message: string;
  token: string;
}
