import { Injectable } from '@angular/core';
import * as msgpack from '@msgpack/msgpack';
import { ClientMessage, ClientHeader, ServerMessage, ServerHeader } from '../../../../types';
import { Subject } from 'rxjs';

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

  sendMsg(msg: string) {
    let client_message: ClientMessage = {
      header: ClientHeader.NewMsg,
      data: msg,
    };

    let bin = msgpack.encode(client_message);

    this.ws.send(bin);
  }
}
