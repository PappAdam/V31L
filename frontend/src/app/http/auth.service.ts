import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/auth/';

  constructor(private http: HttpClient) {}

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
    console.log(res.token);
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
    console.log(res.token);
  }
}

interface LoginResponse {
  message: string;
  token: string;
}
