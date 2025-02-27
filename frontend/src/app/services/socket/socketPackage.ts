import {
  ClientPackage,
  ClientPackageDescription,
  ServerAcknowledgement,
  ServerHeaderType,
  ServerPackage,
} from '../../../../../types';
import * as msgpack from '@msgpack/msgpack';
const URL: string = 'ws://localhost:8080';

export type PendingPackage = {
  dependsOn: string;
  pkg?: {
    encoded: Uint8Array<ArrayBufferLike>;
    uuid: string;
  };
  callback?: () => void;
};

class PackageSender {
  ws: WebSocket;
  pendingPackages: PendingPackage[] = [];
  initializerEvents: (() => void)[] = [];

  private packageEvents: {
    header: ServerHeaderType;
    callback: (pkg: ServerPackage) => void;
  }[] = [];

  constructor(URL: string) {
    this.ws = new WebSocket(URL);
    this.ws.onmessage = this.onIncomingPackage;

    this.ws.onopen = () => {
      this.initializerEvents.forEach((initEvent) => {
        initEvent();
      });
    };

    this.onPackage('Acknowledgement', (pkg) => {
      const incoming = pkg as ServerAcknowledgement;

      this.pendingPackages
        .filter((pp) => pp.dependsOn == incoming.ackMessageId)
        .forEach((pp) => {
          if (pp.callback) {
            pp.callback();
          }
          if (pp.pkg) {
            this.ws.send(pp.pkg.encoded);
          }
          // delete pending
        });
    });
  }

  onInit(callback: () => void) {
    this.initializerEvents.push(callback);
  }

  onPackage(header: ServerHeaderType, callback: (pkg: ServerPackage) => void) {
    const event = {
      header: header,
      callback: callback,
    };

    this.packageEvents.push(event);
  }

  private onIncomingPackage = async (socketMessage: MessageEvent) => {
    const incoming = msgpack.decode(
      await (socketMessage.data as any).arrayBuffer()
    ) as ServerPackage;

    const event = this.packageEvents.find((ev) => ev.header == incoming.header);
    if (event) {
      event.callback(incoming);
    }
  };

  sendPackage(packageDesc: ClientPackageDescription): string {
    const pkg = PackageSender.wrapPackage(packageDesc);
    this.ws.send(pkg.encoded);

    return pkg.uuid;
  }

  createPending(
    dependsOn: string,
    packageDesc?: ClientPackageDescription,
    callback?: () => void
  ): string | null {
    let pkg = undefined;
    if (packageDesc) {
      pkg = PackageSender.wrapPackage(packageDesc);
    }

    this.pendingPackages.push({
      pkg,
      dependsOn,
      callback,
    });

    return pkg ? pkg.uuid : null;
  }

  private static wrapPackage(packageDesc: ClientPackageDescription): {
    encoded: Uint8Array<ArrayBufferLike>;
    uuid: string;
  } {
    const uuid = crypto.randomUUID();
    const pkg: ClientPackage = {
      id: uuid,
      ...packageDesc,
    };

    return {
      encoded: msgpack.encode(pkg),
      uuid: uuid,
    };
  }
}

const Sender = new PackageSender(URL);

export default Sender;
