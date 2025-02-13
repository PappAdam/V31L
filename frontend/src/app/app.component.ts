import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'message_app';
  ws!: WebSocket;
  messages: string[] = [];

  ngAfterViewInit() {
    this.ws = new WebSocket("ws://localhost:8080");
        
    this.ws.onmessage = (msg) => {
        if (msg.data.startsWith("newmsg:")) {
            const parsed = msg.data.slice(7);
            this.messages.push(parsed);
        }
    }

    this.ws.onopen = () => {
        // this.ws.send("initialized");
    }
  }

  sendClicked() {
    let text = (document.querySelector("input[type=text]") as HTMLInputElement).value;
    this.ws.send(text);
  }
}
