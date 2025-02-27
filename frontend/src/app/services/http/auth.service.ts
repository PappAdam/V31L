import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { SocketService } from '../socket/socket.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/auth/';
  private _token$: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);

  constructor(private http: HttpClient, private router: Router) {
    this._token$.next(localStorage.getItem('jwt'));
  }

  /**
   * Gets the plain value of the JWT token
   */
  public get token(): string | null {
    return this._token$.getValue();
  }

  /**
   * Gets a token RxJS observable
   */
  public get token$(): Observable<string | null> {
    return this._token$.asObservable();
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
    if (!this.token) {
      return null;
    }

    const loginRequest = this.http.post<{ token: string }>(
      this.baseUrl + 'refresh',
      {},
      { headers: { Authorization: this.token } }
    );
    const res = await firstValueFrom(loginRequest);
    this.onSuccessfulAuth(res.token);
    return res.token;
  }

  async onSuccessfulAuth(token: string) {
    this._token$.next(token);
    localStorage.setItem('jwt', token);
  }

  logout() {
    this._token$.next(null);
    localStorage.removeItem('jwt');
    this.router.navigateByUrl('/login');
  }
}

interface AuthResponse {
  message: string;
  token: string;
}
