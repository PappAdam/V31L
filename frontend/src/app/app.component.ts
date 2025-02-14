import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClientMessage, Header } from '../../../types';

import * as msgpack from '@msgpack/msgpack';
import { Connection } from '../socket_communication/socket';
import { ConnectionService } from './connection/connection.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'message_app';
  messages: string[] = [];

  constructor(private connection: ConnectionService) {}

  async ngAfterViewInit() {
    this.connection.onMsgRecieved = (msg) => {
      this.messages.push(msg);
    };
    this.connection.event$.subscribe(this.onMsgRecieved);
  }

  onMsgRecieved(msg: string) {}

  sendClicked() {
    let text = (document.querySelector('input[type=text]') as HTMLInputElement)
      .value;

    this.connection.sendMsg(text);
  }
}
