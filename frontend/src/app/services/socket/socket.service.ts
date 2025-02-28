import { Injectable } from '@angular/core';
import { AuthService } from '../http/auth.service';

import PackageSender from './socketPackage';

const URL: string = 'ws://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private authorized: boolean = false;
  packageSender: PackageSender;

  constructor(private authService: AuthService) {
    this.packageSender = new PackageSender(URL, () => {
      authService.token$.subscribe((token) => {
        token ? this.auth(token) : this.deAuth();
      });
    });
  }

  private auth(token: string) {
    if (this.authorized) {
      throw new Error('Cannot authorize while authorized!');
    }

    const authPackage = this.packageSender.createPackage(
      {
        header: 'Authorization',
        token,
      },
      () => {
        this.authorized = true;
      }
    );

    this.packageSender.createPackage(
      {
        header: 'Sync',
        displayedGroupCount: 2,
        maxDisplayableMessagCount: 5,
      },
      () => {},
      authPackage.pkg.id
    );
  }

  private deAuth() {
    if (!this.authorized) {
      throw new Error('Cannot deAuthorize while deAuthorized!');
    }

    this.packageSender.createPackage(
      {
        header: 'DeAuthorization',
      },
      () => {
        this.authorized = false;
      }
    );
  }
}
