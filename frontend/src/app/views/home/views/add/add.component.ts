import { InviteService } from '@/services/invite.service';
import { PlatformService } from '@/services/platform.service';
import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { DeviceInfo } from '@capacitor/device';
import { TabHeaderComponent } from '../../components/tab-header/tab-header.component';
import { MessageService } from '@/services/message.service';
import { EncryptionService } from '@/services/encryption.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '@/services/chat.service';
import { ImgService } from '@/services/img.service';
import imageCompression from 'browser-image-compression';
import Cropper from 'cropperjs';

@Component({
  selector: 'app-add',
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatButtonModule,
    MatIcon,
    MatButtonModule,
    TabHeaderComponent,
    FormsModule,
  ],
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss',
})
export class AddComponent {
  platformService: PlatformService = inject(PlatformService);
  platform: DeviceInfo | null = this.platformService.info;
  inviteService = inject(InviteService);
  chatService = inject(ChatService);
  imgService = inject(ImgService);
  messageService = inject(MessageService);
  encryptionService = inject(EncryptionService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  chatName = new FormControl('');
  connectionString = new FormControl('');
  @ViewChild('imageSelector') imageSelector?: HTMLInputElement;
  @ViewChild('selectedImg') selectedImgElem?: HTMLImageElement;
  img = '';
  selectedFile: File | null = null;

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
    this.img = '';
  }

  async onJoin(event: any) {
    const v = this.connectionString.value;
    if (!v) {
      return;
    }

    const res = await this.inviteService.sendJoinRequest(v);

    this.messageService.selectedChatId = res.chatId;
    this.router.navigate(['app', { outlets: { home: 'messages' } }]);
  }

  async onCreate() {
    const v = this.chatName.value;
    if (!v) {
      return;
    }

    const key = await this.encryptionService.generateChatKey();

    let image: string | undefined = undefined;
    if (this.img) {
      image = await this.imgService.createImage(this.img, key);
    }

    const { chat } = await this.chatService.createChatRequest(v, key, image);
    this.messageService.sendMessage(
      chat.id,
      `This is the start of this conversation.`,
      key
    );

    this.messageService.selectedChatId = chat.id;
    this.router.navigate(['app', { outlets: { home: 'messages' } }]);
  }
}
