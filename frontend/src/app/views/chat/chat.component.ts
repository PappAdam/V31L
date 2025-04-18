import { PlatformService } from '@/services/platform.service';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MessageService } from '@/services/message.service';
import { firstValueFrom, take } from 'rxjs';
import { AuthService } from '@/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { ImgService } from '@/services/img.service';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType } from '@capacitor/camera';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MatButtonModule,
    MessageComponent,
    DetailsComponent,
    CommonModule,
    MatIconModule,
    AsyncPipe,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected platformService: PlatformService = inject(PlatformService);
  platform: DeviceInfo | null = this.platformService.info;

  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);
  chats$ = this.messageService.chats$;
  selectedChatId$ = this.messageService.selectedChatId$;
  protected imgService = inject(ImgService);

  @Input() chatTitle: string = '';
  @ViewChild('msgsWrapper') msgsWrapper?: ElementRef;

  @ViewChild('imageSelector') imageSelector?: HTMLInputElement;
  imgs: string[] = [];
  selectedFile: File | null = null;

  public get imgUploaded(): boolean {
    return this.imgs.length != 0;
  }

  topScrollOffset = 0;

  detailsState = false;

  selectedChat$ = this.messageService.selectedChat$;
  message = '';

  @ViewChild('textInput') textInputDiv!: ElementRef<HTMLElement>;
  onImageUpload(event: any) {
    const file = event.target.files[0] as File | null;
    this.uploadFile(file);
  }

  uploadFile(file: File | null): void {
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imgs.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.imgs.splice(index, 1);
  }

  updateDetailsState(event: boolean) {
    this.detailsState = event;
  }

  sendOnEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  async addFromCamera() {
    const image = await Camera.getPhoto({
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
    });
    if (image.dataUrl) {
      this.imgs.push(image.dataUrl);
    }
  }

  async addFromGallery() {
    const image = await Camera.pickImages({});
    this.imgs = [...this.imgs, ...image.photos.map((e) => e.webPath!)];
  }

  async sendMessage() {
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.imgs.forEach((img) => {
      this.messageService.sendImage(selectedChat.id, img);
    });

    this.imgs = [];

    let message = this.textInputDiv.nativeElement.innerText;
    if (!message || this.messageService.selectedChatId == '') return;
    this.messageService.sendMessage(selectedChat.id, message);
    this.textInputDiv.nativeElement.innerText = '';
  }
}
