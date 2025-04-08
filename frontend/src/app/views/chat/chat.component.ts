import { PlatformService } from '@/services/platform.service';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { Chat, MessageService } from '@/services/message.service';
import { firstValueFrom, Subscription, take } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '@/services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ImgService } from '@/services/img.service';
@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MatButtonModule,
    MessageComponent,
    DetailsComponent,
    MatIconModule,
    MatRipple,
    AsyncPipe,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected platformService: PlatformService = inject(PlatformService);
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);
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

  platform: DeviceInfo | null = this.platformService.info;
  detailsState = 'closed';

  selectedChat$ = this.messageService.selectedChat$;

  messageControl = new FormControl('');
  private subscription!: Subscription;

  ngOnInit() {
    this.subscription = this.selectedChat$.subscribe(this.selectedChatChanged);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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
        this.imgs.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.imgs.splice(index, 1);
  }

  onScroll() {
    const elem = this.msgsWrapper!.nativeElement as HTMLDivElement;
    this.topScrollOffset = elem.scrollHeight - elem.scrollTop;
    if (elem.scrollTop < 50) {
      this.messageService.scrollLoadMessages(
        this.messageService.selectedChat.id
      );

      // elem.scrollTo({
      //   top:
      // });
    }
  }

  updateDetailsState(event: string) {
    this.detailsState = event;
  }

  selectedChatChanged = (chat: Chat) => {
    const elem = this.msgsWrapper?.nativeElement as HTMLDivElement;
    if (elem) {
      elem.scrollTop = elem.scrollHeight;
    }
  };

  async sendMessage() {
    const selectedChat = await firstValueFrom(this.selectedChat$.pipe(take(1)));
    this.imgs.forEach((img) => {
      this.messageService.sendImage(selectedChat.id, img);
    });

    this.imgs = [];

    const message = this.messageControl.value?.trim();
    if (!message || this.messageService.selectedChatIndex == -1) return;
    this.messageService.sendMessage(selectedChat.id, message);
    this.messageControl.reset();
  }
}
