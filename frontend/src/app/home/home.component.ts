import { Component } from '@angular/core';
import { AuthService } from '../services/http/auth.service';
import { SocketService } from '../services/socket/socket.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  title = 'message_app';
  messages: string[] = [];

  constructor(
    private socketService: SocketService,
    protected authService: AuthService
  ) {}

  async ngAfterViewInit() {
    this.socketService.onMsgRecieved = (msg) => {
      this.messages.push(msg);
    };
  }

  async sendClicked() {
    if (this.authService.token) {
      let text = (
        document.querySelector('input[type=text]') as HTMLInputElement
      ).value;

      this.socketService.sendMsg(text, this.authService.token);
    }
  }
}
