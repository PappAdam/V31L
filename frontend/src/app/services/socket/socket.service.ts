import { Injectable } from '@angular/core';
import {
  ClientPackage,
  ClientPackageDescription,
  ServerAcknowledgement,
  ServerHeaderType,
  ServerNewMessagePackage,
  ServerPackage,
  ServerSyncResponsePackage,
} from '../../../../../types';
import { AuthService } from '../http/auth.service';
import * as msgpack from '@msgpack/msgpack';

import PackageSender from './socketPackage';

const URL: string = 'ws://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private authorized: boolean = false;
  packageSender = new PackageSender(URL);

  constructor(private authService: AuthService) {
    this.packageSender.onInit(() => {
      authService.token$.subscribe((token) => {
        token ? this.auth(token) : this.deAuth();
      });
    });

    this.packageSender.onPackage('SyncResponse', (pkg) => {
      const p = pkg as ServerSyncResponsePackage;

      console.log(p.chatMessages);
    });
  }

  private auth(token: string) {
    if (this.authorized) {
      return;
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
      return;
    }

    const deauthPackageId = this.packageSender.sendPackage({
      header: 'DeAuthorization',
    });

    this.packageSender.createPending(deauthPackageId, () => {
      this.authorized = false;
    });
  }
}
