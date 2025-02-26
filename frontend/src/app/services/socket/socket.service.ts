import { Injectable } from '@angular/core';
import * as msgpack from '@msgpack/msgpack';
import { ClientPackage, ServerPackage } from '../../../../../types';
import { AuthService } from '../http/auth.service';

const URL: string = 'ws://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  ws: WebSocket;
  private authorized: boolean = false;

  onMsgRecieved = (msg: string) => {};

  constructor(private authService: AuthService) {
    authService.token$.subscribe((token) => {
      token ? this.auth(token) : this.deAuth();
    });

    authService.token$.subscribe();
    this.ws = new WebSocket(URL);
    this.ws.onmessage = this.onMessage;
  }

  private auth(token: string) {
    if (this.authorized) {
      return;
    }

    let client_message: ClientPackage = {
      header: 'Connection',
      token,
    };

    let bin = msgpack.encode(client_message);
    this.ws.send(bin);
  }

  private deAuth() {
    throw new Error('DeAuth not implemented. socket.service.ts:45');
  }

  private async onMessage(msg: MessageEvent) {
    const incoming = msgpack.decode(
      await (msg.data as any).arrayBuffer()
    ) as ServerPackage;
    switch (
      incoming.header
      // case value:

      //   break;

      // default:
      //   break;
    ) {
    }
    // if (incoming.header == ServerHeader.NewMsg) {
    //   this.onMsgRecieved(incoming.data);
    // }
  }

  sendMsg(messageContent: string, chatId: string) {
    let client_message: ClientPackage = {
      header: 'NewMessage',
      messageContent,
      chatId,
    };

    let bin = msgpack.encode(client_message);

    this.ws.send(bin);
  }
}
