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
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { Camera, CameraResultType } from '@capacitor/camera';

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
  messageService = inject(MessageService);
  encryptionService = inject(EncryptionService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  chatName = new FormControl('');
  connectionString = new FormControl('');
  @ViewChild('imageSelector') imageSelector?: HTMLInputElement;
  img = '';
  selectedFile: File | null = null;

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
        console.log(this.img);
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

    this.messageService.selectedChatId = res.chatId;
    this.router.navigate(['app', { outlets: { home: 'messages' } }]);
  }

  async onCreate() {
    const v = this.chatName.value;
    if (!v) {
      return;
    }

    const { chat, key } = await this.inviteService.createChatRequest(v);

    this.messageService.sendMessage(
      chat.id,
      `This is the start of this conversation.`,
      key
    );

    this.messageService.selectedChatId = chat.id;
    this.router.navigate(['app', { outlets: { home: 'messages' } }]);
  }

  async addImageAndroid() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
    });
    if (image.dataUrl) {
      this.img = image.dataUrl;
    }
  }

  async startScan() {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      android: {
        scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT,
      },
      cameraDirection: 1,
    });

    console.log(result.ScanResult);

    if (!result.ScanResult) {
      return;
    }

    const res = await this.inviteService.sendJoinRequest(result.ScanResult);

    this.messageService.selectedChatId = res.chatId;
    this.router.navigate(['app', { outlets: { home: 'messages' } }]);
  }
}
