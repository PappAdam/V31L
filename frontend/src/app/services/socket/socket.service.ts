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
        console.log('Acknowledged, sync sent');
      }
    );

    console.log(
      'Place this after auth acknowledgement once acknowledgements are finished'
    );
  }

  private deAuth() {
    if (!this.authorized) {
      return;
    }

    let outgoing: ClientPackage = {
      id: crypto.randomUUID(),
      header: 'DeAuthorization',
    };

    let bin = msgpack.encode(outgoing);

    this.authorized = false;
  }
}
