import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
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
import {
  BehaviorSubject,
  combineLatest,
  concat,
  filter,
  from,
  lastValueFrom,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule,
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

  private detailsStatePreference$ = new BehaviorSubject<'open' | 'closed'>(
    'open'
  );

  @Input() set detailsStatePreference(value: 'open' | 'closed') {
    this.detailsStatePreference$.next(value);
  }

  protected detailsState$: Observable<'open' | 'closed'> = combineLatest([
    this.messageService.chats$,
    this.detailsStatePreference$,
  ]).pipe(
    map(([chats, preference]) => {
      return chats.length > 0 ? preference : 'closed';
    })
  );

  invitation$: Observable<string> = this.messageService.selectedChat$.pipe(
    filter((chat) => !!chat),
    switchMap((chat) =>
      concat(
        of(''),
        from(this.inviteService.createInvitation(chat.id)).pipe(
          map((invitation) => invitation || '')
        )
      )
    )
  );

  @ViewChild('invBody') invBody!: ElementRef;
  protected invHeight$: Observable<number | null> = this.invitation$.pipe(
    map((invitation) =>
      invitation ? null : this.invBody.nativeElement.offsetHeight
    )
  );

  async copyToClipboard() {
    const invitation = await lastValueFrom(this.invitation$);

    if (!invitation) {
      this.snackBar.open('There was no invitation to copy.', 'close');
      return;
    }

    await navigator.clipboard.writeText(invitation);
    this.snackBar.open('Invitation copied to clipboard', 'close');
  }

  async onPinnedMessageExpand() {
    this.messageService.getPinnedMessages(this.messageService.selectedChatId);
  }

  async onLeaveChat() {
    const leaveDialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Are you sure you want to leave this chat?',
      },
    });

    

    leaveDialogRef.afterClosed().subscribe((leaveConfirmed: boolean) => {
      if (leaveConfirmed) {
        this.messageService.leaveChat(this.messageService.selectedChatId);
      }
    });
  }
}
