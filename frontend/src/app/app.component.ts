import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Message, Header} from "../../../types/type"

import * as msgpack from "@msgpack/msgpack"

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'message_app';
  ws!: WebSocket;
  messages: string[] = [];

  ngAfterViewInit() {
    this.ws = new WebSocket("ws://10.0.22.36:8080");
        
    this.ws.onmessage = (msg) => {
        const message = msgpack.decode(msg.data) as Message;
        if (message.header == Header.NewMsg) {
          this.messages.push(message.data);
        }
    }

    this.ws.onopen = () => {
      // this.ws.send("initialized");
    };
  }

  sendClicked() {
    let text = (document.querySelector("input[type=text]") as HTMLInputElement).value;
    
    let message: Message = {
      header: Header.NewMsg,
      data: text,
    };

    let bin = msgpack.encode(message);
    this.ws.send(bin);
  }
}
