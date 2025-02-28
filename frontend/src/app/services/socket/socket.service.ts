import { Injectable } from '@angular/core';
import { AuthService } from '../http/auth.service';
import * as msgpack from '@msgpack/msgpack';
import {
  ClientPackage,
  ClientPackageDescription,
  PackageForHeader,
  ServerAcknowledgement,
  ServerHeaderType,
  ServerPackage,
} from '../../../../../types';

const URL: string = 'ws://localhost:8080';

/**
 * Represents an item in the package queue, which tracks the state and dependencies of a package to be sent to the server.
 *
 * @property {string} dependsOn - The ID of the package that this item depends on. This package will only be sent after this package has the `Acknowledged` state.
 * @property {ClientPackage} pkg - The package to be sent to the server. This contains the data and metadata required for the server to process the request.
 * @property {() => void} callback - A function to be executed when the package is acknowledged by the server.
 * @property {'Pending' | 'Sent' | 'Acknowledged'} status - The state of the package:
 *   - `Pending`: The package is waiting for the dependent package (specified in `dependsOn`) to be acknowledged.
 *   - `Sent`: The package has been sent to the server but is awaiting acknowledgment.
 *   - `Acknowledged`: The package has been acknowledged by the server, and the `callback` has been executed.
 */
export type PackageQueueItem = {
  dependsOn: string;
  pkg: ClientPackage;
  callback: () => void;
  status: 'Pending' | 'Sent' | 'Acknowledged';
};

/**
 * Represents an event listener for server package events.
 *
 * @property {ServerHeaderType} header - The type of server package header that this listener is interested in. This determines which server packages will trigger the callback.
 * @property {(pkg: ServerPackage) => void} callback - The function to be executed when a package with the specified `header` is received. The server package (`pkg`) is passed as an argument to the callback.
 */
type PackageEventListener = {
  header: ServerHeaderType;
  callback: (pkg: ServerPackage) => void;
};

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private ws: WebSocket;
  private authorized: boolean = false;
  private packageQueue: PackageQueueItem[] = [];
  private packageEvents: PackageEventListener[] = [];

  constructor(private authService: AuthService) {
    this.ws = new WebSocket(URL);
    this.ws.onmessage = this.onIncomingPackage;
    this.ws.onopen = this.onOpen;
    this.addPackageListener('Acknowledgement', this.onAcknowledgement);
  }

  /**
   * Registers a callback to handle incoming packages with a specific header.
   * @param {ServerHeaderType} header - The header type to listen for.
   * @param {(pkg: PackageForHeader<T>) => void} callback - The callback to execute when a package with the specified header is received.
   */
  addPackageListener<T extends ServerHeaderType>(
    header: T,
    callback: (pkg: PackageForHeader<T>) => void
  ) {
    const listener: PackageEventListener = {
      header: header,
      callback: callback as any,
    };
    // Any cast required because TS is not smart enough to infer the type of pkg in callback(pkg)
    this.packageEvents.push(listener);
  }

  createPackage(
    packageDesc: ClientPackageDescription,
    callback: () => void = () => {},
    dependsOn: string = ''
  ): PackageQueueItem {
    const id = crypto.randomUUID();
    const pkg: ClientPackage = {
      id,
      ...packageDesc,
    };

    const queueItem: PackageQueueItem = {
      dependsOn,
      pkg,
      callback,
      status: 'Pending',
    };
    this.packageQueue.push(queueItem);
    if (!dependsOn) {
      this.sendPackage(queueItem);
    }
    return queueItem;
  }

  private onOpen = () => {
    this.authService.token$.subscribe((token) => {
      token ? this.auth(token) : this.deAuth();
    });
  };

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} socketMessage - The incoming WebSocket message.
   * @private
   */
  private onIncomingPackage = async (socketMessage: MessageEvent) => {
    const incoming = msgpack.decode(
      await (socketMessage.data as any).arrayBuffer()
    ) as ServerPackage;

    this.packageEvents
      .filter((listener) => listener.header == incoming.header)
      .forEach((listener) => listener.callback(incoming));
  };

  private onAcknowledgement = (acknowledgement: ServerAcknowledgement) => {
    const queueItem = this.packageQueue.find(
      (item) => item.pkg.id == acknowledgement.packageId
    );
    if (!queueItem) {
      return;
    }
    queueItem.status = 'Acknowledged';

    queueItem.callback();

    // Sending packages that depended on this one
    this.packageQueue
      .filter((queueItem) => queueItem.status === 'Pending')
      .forEach((queueItem) => {
        if (queueItem.dependsOn === acknowledgement.packageId) {
          this.sendPackage(queueItem);
        }
      });
  };

  /**
   * Sends a queue item to the WebSocket server.
   * @param {PackageQueueItem} queueItem - The queue item to send.
   */
  private sendPackage(queueItem: PackageQueueItem) {
    const encoded = msgpack.encode(queueItem.pkg);
    this.ws.send(encoded);
    queueItem.status = 'Sent';
  }

  private auth(token: string) {
    if (this.authorized) {
      throw new Error('Cannot authorize while authorized!');
    }

    const authPackage = this.createPackage(
      {
        header: 'Authorization',
        token,
      },
      () => {
        this.authorized = true;
      }
    );

    this.createPackage(
      {
        header: 'Sync',
        displayedGroupCount: -1,
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

    this.createPackage(
      {
        header: 'DeAuthorization',
      },
      () => {
        this.authorized = false;
      }
    );
  }
}
