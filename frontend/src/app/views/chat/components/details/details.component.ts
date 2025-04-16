import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GroupOptionCardComponent } from './components/group-option-card/group-option-card.component';
import { GroupMemberCardComponent } from './components/group-member-card/group-member-card.component';
import { Chat, MessageService } from '@/services/message.service';
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
import { ImgService } from '@/services/img.service';
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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
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
  chatService = inject(ChatService);
  imgService = inject(ImgService);

  img?: string;
  newChatName = new FormControl<string | null>(null);
  selectedFile: File | null = null;

  @Input() state: string = 'closed';

  private detailsStatePreference$ = new BehaviorSubject<'open' | 'closed'>(
    'open'
  );

  get chat(): Chat | null {
    return this.messageService.selectedChat || null;
  }

  public get imgUploaded(): boolean {
    return !!this.img;
  }

  onImageUpload(event: any) {
    const file = event.target.files[0] as File | null;
    this.uploadFile(file);
  }

  uploadFile(file: File | null): void {
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.img = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.img = '';
  }

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

  async onEditChat() {
    let updateName;
    let updateImg;
    if (this.newChatName.value) {
      updateName = this.chatService.updateChatRequest(
        this.messageService.selectedChat!.id,
        {
          chatName: this.newChatName.value,
        }
      );
    }
    if (this.img) {
      const imgId = await this.imgService.createImage(
        this.img,
        this.chat?.chatKey
      );

      if (imgId && this.chat) {
        updateImg = this.chatService.updateChatRequest(this.chat.id, {
          chatImgId: imgId,
        });
      }
    }

    if (await updateName) {
      this.newChatName.reset();
    }

    if (await updateImg) {
      this.removeImage();
    }
  }

  async onReset() {
    this.newChatName.reset();
    this.removeImage();
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
