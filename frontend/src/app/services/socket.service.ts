import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import * as msgpack from '@msgpack/msgpack';
import {
  ClientPackage,
  ClientPackageDescription,
  PackageForHeader,
  ServerAcknowledgement,
  ServerHeaderType,
  ServerPackage,
} from '@common';
import { BehaviorSubject, filter, map, Observable, shareReplay } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private ws!: WebSocket;
  private authorized = false;
  private packageQueue: PackageQueueItem[] = [];
  private incomingPackages$ = new BehaviorSubject<ServerPackage[]>([]);

  // Avoids creating multiple observables for the same header
  private headerListenersCache = new Map<
    ServerHeaderType,
    Observable<PackageForHeader<any>[]>
  >();

  private _open$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {
    this.connect();
    this.addPackageListener('Acknowledgement').subscribe((acknowledgement) => {
      this.onAcknowledgement(acknowledgement);
    });
  }

  connect = () => {
    this.ws = new WebSocket(URL);
    this.ws.onmessage = this.onIncomingPackage;
    this.ws.onclose = this.onClose;
    this.ws.onopen = this.onOpen;
  };

  public get open$(): Observable<boolean> {
    return this._open$.asObservable();
  }

  /**
   * Returns the observable for the specified header type.
   * @param {ServerHeaderType} header - The header type to listen for.
   * @returns {Observable<PackageForHeader<T>[]>} - An observable that emits an array of packages with the specified header type.
   */
  getPackagesForHeader<T extends ServerHeaderType>(
    header: T
  ): Observable<PackageForHeader<T>[]> {
    // Retrieving from cache if available
    if (this.headerListenersCache.has(header)) {
      return this.headerListenersCache.get(header) as Observable<
        PackageForHeader<T>[]
      >;
    }

    const observable$ = this.incomingPackages$.pipe(
      map(
        (packages) =>
          packages.filter(
            (pkg) => pkg.header === header
          ) as PackageForHeader<T>[]
      ),
      shareReplay(1)
    );
    this.headerListenersCache.set(header, observable$);
    return observable$;
  }

  addPackageListener<T extends ServerHeaderType>(
    header: T
  ): Observable<PackageForHeader<T>> {
    return this.getPackagesForHeader(header).pipe(
      map((packages) => packages[packages.length - 1]),
      filter((pkg) => pkg !== undefined)
    );
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

  private onClose = () => {
    this._open$.next(false);
    this.authorized = false;
    console.warn('WebSocket connection lost');
    console.info('Reconnecting...');
    this.connect();
  };

  private onOpen = () => {
    this._open$.next(true);
    this.authService.user$.subscribe((user) => {
      user ? this.auth(user.token) : this.deAuth();
    });
    console.info('WebSocket connection established');
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

    this.incomingPackages$.next([...this.incomingPackages$.value, incoming]);
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
        header: 'GetChats',
        chatCount: 10,
        messageCount: 20,
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
