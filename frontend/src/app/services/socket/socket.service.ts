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

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private authorized: boolean = false;

  constructor(private authService: AuthService) {
    PackageSender.onInit(() => {
      authService.token$.subscribe((token) => {
        token ? this.auth(token) : this.deAuth();
      });
    });

    PackageSender.onPackage('SyncResponse', (pkg) => {
      const p = pkg as ServerSyncResponsePackage;

      console.log(p.chatMessages);
    });
  }

  private auth(token: string) {
    if (this.authorized) {
      return;
    }

    const authPackageId = PackageSender.sendPackage({
      header: 'Authorization',
      token,
    });

    PackageSender.createPending(
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

    const deauthPackageId = PackageSender.sendPackage({
      header: 'DeAuthorization',
    });

    PackageSender.createPending(deauthPackageId, () => {
      this.authorized = false;
    });
  }
}
