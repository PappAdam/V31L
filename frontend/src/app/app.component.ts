import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClientMessage, ClientHeader } from '../../../types';

import * as msgpack from '@msgpack/msgpack';
import { SocketService } from './services/socket/socket.service';
import { AuthService } from './services/http/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'message_app';
  messages: string[] = [];

  constructor(private socket: SocketService, private auth: AuthService) {}

  async ngAfterViewInit() {
    this.socket.onMsgRecieved = (msg) => {
      this.messages.push(msg);
    };
  }

  onMsgRecieved(msg: string) {}

  async sendClicked() {
    let text = (document.querySelector('input[type=text]') as HTMLInputElement)
      .value;

    await this.auth.login("asd", "asd");
    this.socket.sendMsg(text, "6ab2f92e-1ce8-4ec8-ad14-68a9b85baa87");

    console.log(this.auth.token); 
  }
}
