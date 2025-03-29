import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GroupOptionCardComponent } from './components/group-option-card/group-option-card.component';
import { GroupMemberCardComponent } from './components/group-member-card/group-member-card.component';
import { MessageService } from '@/services/message.service';
import { AsyncPipe } from '@angular/common';
import { InviteService } from '@/services/invite.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

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
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent {
  @Input() state: string = 'closed';

  messageService = inject(MessageService);
  inviteService = inject(InviteService);
  dialog = inject(MatDialog);

  invitationId: string = 'Creating you invitation...';

  async onAddMemberClick() {
    if (!this.messageService.selectedChat) return;

    const createInvitationResponse = await this.inviteService.createInvitation(
      this.messageService.selectedChat.id
    );

    // TODO Proper error handling
    if (createInvitationResponse.result == 'Error') return;

    this.invitationId = createInvitationResponse.invId;
  }

  async onLeaveChat() {
    const leaveDialogRef = this.dialog.open(LeaveChatDialog);

    leaveDialogRef.afterClosed().subscribe((leaveConfirmed: boolean) => {
      if (leaveConfirmed) {
        this.messageService.leaveChat(this.messageService.selectedChat.id);
      }
    });
  }
}

@Component({
  selector: 'dialog-leave-chat',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h3 mat-dialog-title>Are you sure you want to leave this chat?</h3>
    <mat-dialog-actions>
      <button mat-flat-button cdkFocusInitial [mat-dialog-close]="false">
        No
      </button>
      <button mat-button [mat-dialog-close]="true">Yes</button>
    </mat-dialog-actions>
  `,

  styles: '',
})
export class LeaveChatDialog {
  readonly dialogRef = inject(MatDialogRef<LeaveChatDialog>);
}
