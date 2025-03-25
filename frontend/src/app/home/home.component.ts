import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MessageService } from '@/services/message.service';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  take,
  first,
} from 'rxjs';
import { tap } from 'rxjs/operators';
import { InviteService } from '@/services/invite.service';
import { EncryptionService } from '@/services/encryption.service';

@Component({
  selector: 'app-home',
  imports: [
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);
  protected inviteService = inject(InviteService);
  protected encryptionService = inject(EncryptionService);

  protected inviteId = '';

  chats$ = this.messageService.chats$;
  selectedChatIndex$ = this.messageService.selectedChatIndex$;

  selectedChat$ = combineLatest([this.chats$, this.selectedChatIndex$]).pipe(
    map(([messages, index]) => messages[index])
  );

  messageControl = new FormControl('');
  joinControl = new FormControl('');

  constructor() {}

  async sendMessage() {
    const message = this.messageControl.value?.trim();
    if (!message || this.messageService.currentSelectedChatIndex() == -1)
      return;
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.messageService.sendMessage(selectedChat.id, message);
    this.messageControl.reset();
  }

  async sendJoin() {
    const invId = this.joinControl.value?.trim();
    if (!invId) {
      return;
    }

    this.inviteService.sendJoinRequest(invId, this.encryptionService.globalKey);
  }

  async createInvite() {
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    const invite = await this.inviteService.createInvitation(selectedChat.id);
    if (invite.result == 'Success' && invite.type == 'Create') {
      this.inviteId = invite.invId;
    }

    navigator.clipboard.writeText(this.inviteId);
  }
}
