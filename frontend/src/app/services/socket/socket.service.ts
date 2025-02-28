import { Injectable } from '@angular/core';
import { ServerSyncResponsePackage } from '../../../../../types';
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

    const authPackageId = this.packageSender.sendPackage({
      header: 'Authorization',
      token,
    });

    this.packageSender.createPending(
      authPackageId,
      {
        header: 'Sync',
        displayedGroupCount: 2,
        maxDisplayableMessagCount: -1,
      },
      () => {
        this.authorized = true;
      }
    );
  }

  private deAuth() {
    if (!this.authorized) {
      throw new Error('Cannot deAuthorize while deAuthorized!');
    }

    const deAuthPackageId = this.packageSender.sendPackage({
      header: 'DeAuthorization',
    });

    this.packageSender.createPending(deAuthPackageId, () => {
      this.authorized = false;
    });
  }
}
