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

@Component({
  selector: 'app-add',
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatButtonModule,
    MatIcon,
    FormsModule,
  ],
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss',
})
export class AddComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor() {
    this.platform = this.platformService.info;
  }
  chatName = new FormControl('');
  connectionString = new FormControl('');
  @ViewChild('imageSelector') imageSelector?: HTMLInputElement;
  img = '';
  selectedFile: File | null = null;
  inviteService = inject(InviteService);

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

  async onJoin(event: any) {
    const v = this.connectionString.value;
    if (!v) {
      return;
    }

    const res = await this.inviteService.sendJoinRequest(v);
    console.log(res);
  }

  async onCreate() {
    const v = this.chatName.value;
    if (!v) {
      return;
    }

    const res = await this.inviteService.createChatRequest(v);
    console.log(res);
  }
}
