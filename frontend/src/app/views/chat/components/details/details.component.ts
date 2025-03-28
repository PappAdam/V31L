import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GroupOptionCardComponent } from './components/group-option-card/group-option-card.component';
import { GroupMemberCardComponent } from './components/group-member-card/group-member-card.component';
import { MessageService } from '@/services/message.service';
import { AsyncPipe } from '@angular/common';
import { InviteService } from '@/services/invite.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

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
}
