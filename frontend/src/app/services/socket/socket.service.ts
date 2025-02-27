import { Injectable } from '@angular/core';
import * as msgpack from '@msgpack/msgpack';
import {
  ClientPackage,
  ServerHeaderType,
  ServerNewMessagePackage,
  ServerPackage,
} from '../../../../../types';
import { AuthService } from '../http/auth.service';
import { Subject } from 'rxjs';

const URL: string = 'ws://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  ws: WebSocket;
  private authorized: boolean = false;
  private pendingPackets: ServerPackage[] = [];
  private packageEvents: {header: ServerHeaderType, callback: (pkg: ServerPackage) => void}[] = [];


  private newMessageSubject = new Subject<ServerNewMessagePackage>();
  newMessageRecieved$ = this.newMessageSubject.asObservable();

  constructor(private authService: AuthService) {
    this.ws = new WebSocket(URL);

    this.ws.onopen = () => {
      authService.token$.subscribe((token) => {
        token ? this.auth(token) : this.deAuth();
      });
      this.ws.onmessage = this.onIncomingPackage;
    };

    this.on("NewMessage", (pkg) => {
        // this.newMessageSubject.next(pkg);
    })
  }

  on(header: ServerHeaderType, callback: (pkg: ServerPackage) => void) {
    const event = {
      header: header,
      callback: callback,
    };

    const index = this.packageEvents.findIndex((p) => p.header == header);
    if (index < 0) {
      this.packageEvents.push(event);  
    }
    else {
      this.packageEvents.splice(index, 1, event);
    }
  }

  private onIncomingPackage = async (socketMessage: MessageEvent) => {
    const incoming = msgpack.decode(
      await (socketMessage.data as any).arrayBuffer()
    ) as ServerPackage;

    const event = this.packageEvents.find((ev) => ev.header == incoming.header);
    if (event) {
      event.callback(incoming);
    }
  }
  
  sendMessage(messageContent: string, chatId: string) {
    let outgouing: ClientPackage = {
      id: crypto.randomUUID(),
      header: 'NewMessage',
      messageContent,
      chatId,
    };

    let bin = msgpack.encode(outgouing);

    this.ws.send(bin);
  }

  private auth(token: string) {
    if (this.authorized) {
      return;
    }

    let outgoing: ClientPackage = {
      id: crypto.randomUUID(),
      header: 'Authorization',
      token,
    };

    let bin = msgpack.encode(outgoing);
    this.ws.send(bin);

    console.log(
      'Place this after auth acknowledgement once acknowledgements are finished'
    );

    this.authorized = true;
    
    outgoing = {
      id: crypto.randomUUID(),
      header: 'Sync',
      maxDisplayableMessagCount: 2,
      displayedGroupCount: -1,
    };
    
    bin = msgpack.encode(outgoing);
    this.ws.send(bin);
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
    this.ws.send(bin);
    this.authorized = false;
  }
}
