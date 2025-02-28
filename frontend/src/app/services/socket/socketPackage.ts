import {
  ClientPackage,
  ClientPackageDescription,
  PackageForHeader,
  ServerAcknowledgement,
  ServerHeaderType,
  ServerPackage,
} from '../../../../../types';
import * as msgpack from '@msgpack/msgpack';

export type PackageQueueItem = {
  dependsOn: string;
  pkg: ClientPackage;
  callback: () => void;
  status: 'Pending' | 'Sent' | 'Acknowledged';
};

/**
 * A class for managing WebSocket communication, including sending client packages,
 * handling server responses, and managing pending packages that depend on acknowledgements.
 *
 * @example
 *
 * // Register an initialization callback
 * sender.onInit(() => {
 *   console.log('WebSocket connection opened');
 * });
 *
 * // Register a callback for handling incoming "NewMessage" packages
 * sender.onPackage('NewMessage', (pkg: ServerNewMessagePackage) => {
 *   console.log('New message received:', pkg.messageContent);
 * });
 *
 * // Register a callback for handling incoming "Acknowledgement" packages
 * sender.onPackage('Acknowledgement', (pkg: ServerAcknowledgement) => {
 *   console.log('Acknowledgement received for message ID:', pkg.ackMessageId);
 * });
 *
 * // Send a "NewMessage" package
 * const newMessagePackage: ClientNewMessagePackage = {
 *   header: 'NewMessage',
 *   chatId: '12345',
 *   messageContent: 'Hello, World!'
 * };
 * const messageId = sender.sendPackage(newMessagePackage);
 * console.log('Sent message with ID:', messageId);
 *
 * // Create a pending package that waits for an acknowledgement
 * const pendingId = sender.createPending('id-from-package', newMessagePackage, () => {
 *   console.log('Acknowledgement received, pending package processed');
 * });
 * console.log('Created pending package with ID:', pendingId);
 */
export default class PackageSender {
  private ws: WebSocket;
  private packageQueue: PackageQueueItem[] = [];

  private packageEvents: {
    header: ServerHeaderType;
    callback: (pkg: ServerPackage) => void;
  }[] = [];

  /**
   * Creates a new PackageSender instance.
   * @param {string} URL - The WebSocket server URL to connect to.
   * @param {() => void} onOpen - Callback function to run when the connection is opened.
   */
  constructor(URL: string, onOpen: () => void) {
    this.ws = new WebSocket(URL);
    this.ws.onmessage = this.onIncomingPackage;
    this.ws.onopen = onOpen;
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
    const listener = {
      header: header,
      callback: callback,
    };

    // Any cast required because TS is not smart enough to infer the type of pkg in callback
    this.packageEvents.push(listener as any);
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

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} socketMessage - The incoming WebSocket message.
   * @private
   */
  private onIncomingPackage = async (socketMessage: MessageEvent) => {
    const incoming = msgpack.decode(
      await (socketMessage.data as any).arrayBuffer()
    ) as ServerPackage;

    const event = this.packageEvents.find((ev) => ev.header == incoming.header);
    if (event) {
      event.callback(incoming);
    }
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
}
