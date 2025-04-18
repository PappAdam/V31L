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
import imageCompression from 'browser-image-compression';
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
  imageInput = new FormControl<string>('');
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

  async uploadFile(file: File | null) {
    if (file && file.type.startsWith('image/')) {
      const compressed = await imageCompression(file, {
        maxSizeMB: 10,
        useWebWorker: true,
      });

      this.selectedFile = compressed;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.img = e.target?.result as string;
      };
      reader.readAsDataURL(compressed);
    }
  }

  removeImage() {
    this.imageInput.reset();
    this.selectedFile = null;
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

  invitation$: Observable<string> = this.messageService.selectedChatId$.pipe(
    filter((chat) => !!chat),
    switchMap((chat) =>
      concat(
        of(''),
        from(this.inviteService.createInvitation(chat)).pipe(
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

  async copyToClipboard(inv: string | null) {
    if (!inv) {
      this.snackBar.open('There was no invitation to copy.', 'close');
      return;
    }

    await navigator.clipboard.writeText(inv);
    this.snackBar.open('Invitation copied to clipboard', 'close');
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

  onReset() {
    this.removeImage();
    this.newChatName.reset();
  }

  async onPinnedMessageExpand() {
    this.messageService.getPinnedMessages(this.messageService.selectedChat!.id);
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
