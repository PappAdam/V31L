import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
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

  /**
   * Logs the user in with the username password combination.
   * If the login is successful, it updates the stored token and returns the new token.
   *
   * @returns {Promise<string | null>} The new token if the login is successful, `null` if the login fails.
   */
  async login(username: string, password: string): Promise<string | null> {
    return await this.authorize(username, password, 'login');
  }

  /**
   * Registers the user in with the username password combination.
   * If the register is successful, it updates the stored token and returns the new token.
   *
   * @returns {Promise<string | null>} The new token if the register is successful, `null` if it fails.
   */
  async register(username: string, password: string): Promise<string | null> {
    return await this.authorize(username, password, 'register');
  }

  private async authorize(
    username: string,
    password: string,
    authUrlPath: 'login' | 'register'
  ) {
    const body = {
      username,
      password,
    };
    const registerRequest = this.http.post<AuthResponse>(
      this.baseUrl + authUrlPath,
      body
    );

    try {
      const res = await firstValueFrom(registerRequest);
      this.saveToken(res.token);
      return res.token;
    } catch {
      return null;
    }
  }

  /**
   * Refreshes the authentication token by making a request to the refresh endpoint.
   * If the token is successfully refreshed, it updates the stored token and returns the new token.
   *
   * @returns {Promise<string | null>} The new token if the refresh is successful,
   * or `null` if no token is available or the refresh fails.
   */
  async refreshToken(): Promise<string | null> {
    if (!this.token) {
      return null;
    }

    const refreshRequest = this.http.post<{ token: string }>(
      this.baseUrl + 'refresh',
      {},
      { headers: { Authorization: this.token } }
    );

    try {
      const res = await firstValueFrom(refreshRequest);
      this.saveToken(res.token);
      return res.token;
    } catch {
      return null;
    }
  }

  private saveToken(token: string): void {
    this._token$.next(token);
    localStorage.setItem('jwt', token);
  }

  logout(): void {
    this._token$.next(null);
    localStorage.removeItem('jwt');
    this.router.navigateByUrl('/login');
  }
}

// TODO: Move class into common (shared) types
interface AuthResponse {
  message: string;
  token: string;
}
