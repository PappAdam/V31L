import { AuthService } from '@/services/auth.service';
import { Message } from '@/services/encryption.service';
import { ImgService } from '@/services/img.service';
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
  previousSender: string | null = null;
  currentSender: string | null = null;
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);

  @Input({ required: true }) message!: Message;
  @Input() first: boolean = false;
  @Input() displayedIn: 'Chat' | 'PinnedMessages' = 'Chat';
  img = inject(ImgService);
  imgURL?: String;

  async ngOnInit() {
    this.imgURL = await this.img.getUrl(
      'pfpImg',
      this.messageService.selectedChat.chatKey
    );
  }

  get ownMessage() {
    return this.message.user.username == this.authService.user?.username;
  }

  togglePinMessage() {
    this.messageService.pinMessage(this.message.id, !this.message.pinned);
    this.message.pinned = !this.message.pinned;
  }
}
