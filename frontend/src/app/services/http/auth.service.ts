import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthSuccessResponse } from '@common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/auth/';
  private _user$: BehaviorSubject<StoredUser | null> =
    new BehaviorSubject<StoredUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const user = localStorage.getItem('user');
    if (user) {
      this._user$.next(JSON.parse(user));
    }
  }

  /**
   * Gets the plain value of the JWT token
   */
  public get user(): StoredUser | null {
    return this._user$.getValue();
  }

  /**
   * Gets a token RxJS observable
   */
  public get user$(): Observable<StoredUser | null> {
    return this._user$.asObservable();
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
    const registerRequest = this.http.post<AuthSuccessResponse>(
      this.baseUrl + authUrlPath,
      body
    );

    try {
      const res = await firstValueFrom(registerRequest);
      this.saveUser(res);
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
    if (!this.user) {
      return null;
    }

    const refreshRequest = this.http.post<AuthSuccessResponse>(
      this.baseUrl + 'refresh',
      {},
      { headers: { Authorization: this.user.token } }
    );

    try {
      const res = await firstValueFrom(refreshRequest);
      this.saveUser(res);
      return res.token;
    } catch {
      return null;
    }
  }

  private saveUser(user: StoredUser): void {
    this._user$.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    this._user$.next(null);
    localStorage.removeItem('user');
    this.router.navigateByUrl('/login');
  }
}

type StoredUser = Omit<AuthSuccessResponse, 'result'>;
