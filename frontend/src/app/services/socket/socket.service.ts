import { Injectable } from '@angular/core';
import * as msgpack from '@msgpack/msgpack';
import {
  ClientPackage,
  ServerHeader,
  ServerPackage,
} from '../../../../../types';
import { AuthService } from '../http/auth.service';

const URL: string = 'ws://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  ws: WebSocket;

  onMsgRecieved = (msg: string) => {};

  constructor() {
    this.ws = new WebSocket(URL);
    this.ws.onmessage = async (msg) => {
      const message = msgpack.decode(
        await (msg.data as any).arrayBuffer()
      ) as ServerPackage;
      if (message.header == ServerHeader.NewMsg) {
        this.onMsgRecieved(message.data);
      }
    };
  }

  connect(token: string) {
    let client_message: ClientPackage = {
      header: 'Connection',
      token,
    };

    let bin = msgpack.encode(client_message);
    this.ws.send(bin);
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
