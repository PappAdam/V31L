import { Injectable } from '@angular/core';
import * as msgpack from '@msgpack/msgpack';
import {
  ClientPackage,
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
  }

  private async onIncomingPackage(socketMessage: MessageEvent) {
    const incoming = msgpack.decode(
      await (socketMessage.data as any).arrayBuffer()
    ) as ServerPackage;
    switch (incoming.header) {
      case 'NewMessage':
        this.newMessageSubject.next(incoming);
        break;
      default:
        throw new Error('Server package handler not implemented.');
    }
  }

  sendMessage(messageContent: string, chatId: string) {
    let outgouing: ClientPackage = {
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
      header: 'Authorization',
      token,
    };

    let bin = msgpack.encode(outgoing);
    this.ws.send(bin);

    console.log(
      'Place this after auth acknowledgement once acknowledgements are finished'
    );
    this.authorized = true;
  }

  private deAuth() {
    if (!this.authorized) {
      return;
    }

    let outgoing: ClientPackage = {
      header: 'DeAuthorization',
    };

    let bin = msgpack.encode(outgoing);
    this.ws.send(bin);
    this.authorized = false;
  }
}
