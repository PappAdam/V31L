import { Injectable } from '@angular/core';
import * as msgpack from '@msgpack/msgpack';
import {
  ClientMessage,
  ClientHeader,
  ServerMessage,
  ServerHeader,
} from '../../../../types';

const URL: string = 'ws://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  ws: WebSocket;

  onMsgRecieved = (msg: string) => {};

  constructor() {
    this.ws = new WebSocket(URL);
    this.ws.onmessage = async (msg) => {
      const message = msgpack.decode(
        await (msg.data as any).arrayBuffer()
      ) as ServerMessage;
      if (message.header == ServerHeader.NewMsg) {
        this.onMsgRecieved(message.data);
      }
    };
  }

  connect(token: string) {
    let client_message: ClientMessage = {
      header: ClientHeader.Connection,
      data: {
        target: token,
        content: '',
      },
    };

    let bin = msgpack.encode(client_message);

    this.ws.send(bin);
  }

  sendMsg(msg: string, target_chat: string) {
    let client_message: ClientMessage = {
      header: ClientHeader.NewMsg,
      data: {
        target: target_chat,
        content: msg,
      },
    };

    let bin = msgpack.encode(client_message);

    this.ws.send(bin);
  }
}
