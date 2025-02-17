import * as msgpack from '@msgpack/msgpack';
import * as types from '../../../types';

export class Connection {
  ws: WebSocket;
  onMsgRecieved = (msg: string) => {};

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = async (msg) => {
      const message = msgpack.decode(
        await (msg.data as any).arrayBuffer()
      ) as types.ClientMessage;
      if (message.header == types.ClientHeader.NewMsg) {
        this.onMsgRecieved(message.data);
      }
    };
  }

  sendMsg(msg: string) {
    let client_message: types.ClientMessage = {
      header: types.ClientHeader.NewMsg,
      data: msg,
    };

    let bin = msgpack.encode(client_message);

    this.ws.send(bin);
  }
}
