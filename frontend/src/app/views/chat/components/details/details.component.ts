import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GroupOptionCardComponent } from './components/group-option-card/group-option-card.component';
import { GroupMemberCardComponent } from './components/group-member-card/group-member-card.component';
import { MessageService } from '@/services/message.service';
import { AsyncPipe } from '@angular/common';
import { InviteService } from '@/services/invite.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QRcodeComponent } from '../../../../qrcode/qrcode.component';
import { MatDialog } from '@angular/material/dialog';
import { MessageComponent } from '../message/message.component';
import { PlatformService } from '@/services/platform.service';
import { DeviceInfo } from '@capacitor/device';
import { ConfirmDialog } from '@/components/confirm-dialog/confirm-dialog.component';

GroupMemberCardComponent;
@Component({
  selector: 'app-details',
  imports: [
    MatIconModule,
    GroupOptionCardComponent,
    GroupMemberCardComponent,
    MatButtonModule,
    MatDividerModule,
    AsyncPipe,
    MessageComponent,
    QRcodeComponent,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent {
  protected platformService = inject(PlatformService);
  platform: DeviceInfo | null = null;
  constructor() {
    this.platform = this.platformService.info;
  }
  @Input() state: string = 'closed';

  messageService = inject(MessageService);
  inviteService = inject(InviteService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  invitation: string = 'Creating you invitation...';

  async copyToClipboard() {
    if (!this.invitation) return;

    await navigator.clipboard.writeText(this.invitation);

    this.snackBar.open('Invitation copied to clipboard', 'close', {
      duration: 2000,
      horizontalPosition: 'right',
    });
  }

  async onAddMemberExpand() {
    if (!this.messageService.selectedChat) return;

    const invitation = await this.inviteService.createInvitation(
      this.messageService.selectedChat.id
    );

    if (invitation) {
      this.invitation = invitation;
    }
  }

  async onPinnedMessageExpand() {
    this.messageService.getPinnedMessages(this.messageService.selectedChat.id);
  }

  async onLeaveChat() {
    const leaveDialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Are you sure you want to leave this chat?',
      },
    });

    leaveDialogRef.afterClosed().subscribe((leaveConfirmed: boolean) => {
      if (leaveConfirmed) {
        this.messageService.leaveChat(this.messageService.selectedChat.id);
      }
    });
  }
}
