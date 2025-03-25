import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  AuthResponse,
  AuthSuccessResponse,
  AuthErrorResponse,
  AuthNextResponse,
} from '@common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/auth/';

  private _user$: BehaviorSubject<StoredUser | null> =
    new BehaviorSubject<StoredUser | null>(null);
  /**
   * Gets the plain value of the user
   */
  public get user(): StoredUser | null {
    return this._user$.getValue();
  }
  /**
   * Gets a user RxJS observable
   */
  public get user$(): Observable<StoredUser | null> {
    return this._user$.asObservable();
  }

  get tokenPayload() {
    if (!this.user?.token) return null;

    const payloadBase64 = this.user.token.split('.')[1]; // Extract payload
    const payloadDecoded = atob(payloadBase64); // Decode Base64
    return JSON.parse(payloadDecoded); // Parse JSON
  }

  /**
   * Used in 2FA login, so the user doesn't have to type his username again.
   */
  private lastUsername = '';
  /**
   * Used in 2FA login, so the user doesn't have to type his password again.
   */
  private lastPassword = '';

  constructor(private http: HttpClient, private router: Router) {
    const user = localStorage.getItem('user');
    if (user) {
      this._user$.next(JSON.parse(user));
    }
  }

  /**
   * Authorizes a user by sending their credentials to the server.
   * This method sends a POST request to the specified authentication endpoint
   *
   * @param {string} username - The username of the user
   * @param {string} password - The password of the user
   * @param {'login' | 'register'} authUrlPath - The authentication endpoint to use. Must be either 'login' or 'register'
   * @param {string | null} mfa - The 2FA code to send the request with. Sets `mfaEnabled` to `true` in the request body. Use empty string when registering to enable 2FA
   * @returns {Promise<AuthResponse>} A promise that resolves to the authentication response.
   * - If the request is successful, it returns an {@link AuthSuccessResponse} | {@link AuthNextResponse}
   * - If the request fails, it returns an {@link AuthErrorResponse}
   */
  async authorize(
    username: string,
    password: string,
    authUrlPath: 'login' | 'register',
    mfa: string | null
  ): Promise<AuthResponse> {
    const body = { username, password, mfaEnabled: mfa != null, mfa };
    try {
      const response = await lastValueFrom(
        this.http.post<AuthSuccessResponse | AuthNextResponse>(
          this.baseUrl + authUrlPath,
          body
        )
      );

      if (response.result == 'Success') {
        this.saveUser(response);
      }
      // Storing username and password for 2FA authentication.
      else if (response.result == 'Next') {
        this.lastPassword = password;
        this.lastUsername = username;
      }

      return response;
    } catch (httpError: any) {
      return httpError.error as AuthErrorResponse;
    }
  }

  async authorize2FA(code: string) {
    if (!this.lastPassword || !this.lastUsername) {
      console.warn(
        'You should not use authorize2FA without having lastUsername and lastPassword set!'
      );
    }

    const body = {
      username: this.lastUsername,
      password: this.lastPassword,
      mfa: code,
    };

    try {
      const response = await lastValueFrom(
        this.http.post<AuthSuccessResponse>(this.baseUrl + 'login', body)
      );

      if (response.result == 'Success') {
        this.saveUser(response);
      }

      return response;
    } catch (httpError: any) {
      return httpError.error as AuthErrorResponse;
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
      const res = await lastValueFrom(refreshRequest);
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

export type StoredUser = Omit<AuthSuccessResponse, 'result'>;
