import { AuthService } from '@/services/auth.service';
import { Message } from '@/services/encryption.service';
import { MessageService } from '@/services/message.service';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);

  @Input({ required: true }) message!: Message;
  @Input() first: boolean = false;

  // Message options and side in the main chat
  @Input() displayedIn: 'Chat' | 'PinnedMessages' = 'Chat';

  get ownMessage() {
    return this.message.user.username == this.authService.user?.username;
  }

  togglePinMessage() {
    this.messageService.pinMessage(this.message.id, !this.message.pinned);
    this.message.pinned = !this.message.pinned;
  }
}
