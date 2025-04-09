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
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChatService } from '@/services/chat.service';

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
  platform: DeviceInfo | null = this.platformService.info;
  messageService = inject(MessageService);
  inviteService = inject(InviteService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  chatService = inject(ChatService);

  @Input() state: string = 'closed';

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

  async onEditChatName() {
    const dialogRef = this.dialog.open(ChangeChatNameDialog);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.chatService.updateChatRequest(
          this.messageService.selectedChat.id,
          {
            chatName: result,
          }
        );
      }
    });
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

@Component({
  selector: 'change-chat-name-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  template: `
    <h3 mat-dialog-title>Change Chat Name</h3>
    <mat-dialog-content>
      <mat-form-field appearance="outline" [style.margin-top.px]="10">
        <mat-label>New Chat Name</mat-label>
        <input
          matInput
          [formControl]="name"
          placeholder="Enter new chat name"
          maxlength="30"
          type="text"
        />
        @if (name.hasError('required')) {
        <mat-error> Name is required </mat-error>
        } @if (name.hasError('maxlength')) {
        <mat-error> Maximum 30 characters </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="''">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="name.invalid"
        (click)="submitName()"
      >
        Save
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
})
export class ChangeChatNameDialog {
  name = new FormControl('', [Validators.required, Validators.maxLength(30)]);

  constructor(private dialogRef: MatDialogRef<ChangeChatNameDialog>) {}

  submitName() {
    this.dialogRef.close(this.name.value);
  }
}
