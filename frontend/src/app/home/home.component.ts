import { Component } from '@angular/core';
import { AuthService } from '../services/http/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { SocketService } from '../services/socket/socket.service';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule],
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
    this.socketService.newMessageRecieved$.subscribe((message) => {
      this.messages.push(message.messageContent);
    });
  }

  async sendClicked() {
    if (this.authService.token) {
      let text = (
        document.querySelector('input[type=text]') as HTMLInputElement
      ).value;

      throw new Error(
        'Sending messages is not available because ChatId is not implemented yet.'
      );
      // this.socketService.sendMessage(text, CHATID HERE);
    }
  }
}
