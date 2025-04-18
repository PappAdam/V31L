import { PlatformService } from '@/services/platform.service';
import {
  Component,
  ElementRef,
  inject,
  Input,
  NgZone,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HeaderComponent } from './components/header/header.component';
import { MessageComponent } from './components/message/message.component';
import { DetailsComponent } from './components/details/details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { Chat, MessageService } from '@/services/message.service';
import { AuthService } from '@/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { ImgService } from '@/services/img.service';
import {
  BehaviorSubject,
  filter,
  map,
  pairwise,
  scan,
  Subject,
  tap,
} from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-chat',
  imports: [
    HeaderComponent,
    MatButtonModule,
    MessageComponent,
    DetailsComponent,
    MatIconModule,
    AsyncPipe,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected platformService = inject(PlatformService);
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);
  protected imgService = inject(ImgService);
  protected renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  protected platform: DeviceInfo | null = this.platformService.info;
  protected selectedChat$ = this.messageService.selectedChat$;

  @ViewChild('imageSelector') imageSelector?: HTMLInputElement;

  imgs: string[] = [];
  selectedFile: File | null = null;
  public get imgUploaded(): boolean {
    return this.imgs.length != 0;
  }

  @ViewChild('textInput') textInputDiv!: ElementRef<HTMLElement>;
  message = '';

  detailsState: 'open' | 'closed' = 'closed';

  async onImageUpload(event: any) {
    const file = event.target.files[0] as File | null;
    if (file) {
      this.uploadFile(file);
    }
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
        this.imgs.push(e.target?.result as string);
      };
      reader.readAsDataURL(compressed);
    }
  }

  removeImage(index: number) {
    this.imgs.splice(index, 1);
  }

  updateDetailsState(event: 'open' | 'closed') {
    this.detailsState = event;
  }

  sendOnEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  async sendMessage() {
    const selectedChat = this.messageService.selectedChat;
    if (!selectedChat) return;

    this.imgs.forEach((img) => {
      this.messageService.sendImage(selectedChat.id, img);
    });

    this.imgs = [];

    let message = this.textInputDiv.nativeElement.innerText;
    if (!message || this.messageService.selectedChatId == '') return;
    this.messageService.sendMessage(selectedChat.id, message);
    this.textInputDiv.nativeElement.innerText = '';
  }

  //#region Scrolling
  @ViewChild('messagesWrapper') messagesWrapper!: ElementRef;

  protected scrolledToBottom = true;
  // True if waiting for messages to arrive (request has been sent)
  protected loadingMessages = false;
  private scrollPositions: Record<string, number> = {};

  // If the scroll is near the top (tolerance is given in px), load more messages.
  // This controls the `loadingMessages` boolean.
  onScroll(event: Event) {
    const element = event.target as HTMLElement;

    if (element.scrollTop == 0 && !this.loadingMessages) {
      this.loadingMessages = true;
      this.messageService
        .scrollLoadMessages(this.messageService.selectedChatId)
        .then(() => (this.loadingMessages = false));
    }

    this.scrolledToBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight;

    this.scrollPositions[this.messageService.selectedChatId] =
      element.scrollTop;
  }

  // The height of the element before a redraw.
  private oldHeight = 0;
  ngAfterViewInit() {
    this.oldHeight = this.messagesWrapper.nativeElement.scrollHeight;
    this.messagesWrapperWidth = this.messagesWrapper.nativeElement.clientWidth;
    this.resizeObserver.observe(this.messagesWrapper.nativeElement);
  }

  private oldChat: Chat | null = null;

  // When a new message arrives (chat is unchanged, only messages update), update newHeight.
  private maintainScrollSubscription = this.selectedChat$
    .pipe(
      filter((chat) => {
        return (
          !!chat && !!this.messagesWrapper && this.oldChat?.id === chat?.id
        );
      }),
      tap((chat) => {
        requestAnimationFrame(() => {
          const messagesArrivedOnTop = this.oldChat
            ? this.oldChat.messages[0].id != chat!.messages[0].id
            : false;

          this.oldChat = { ...chat! };

          const newHeight = this.messagesWrapper.nativeElement.scrollHeight;
          const diff = newHeight - this.oldHeight;
          this.oldHeight = newHeight;
          if (messagesArrivedOnTop || this.scrolledToBottom) {
            this.messagesWrapper.nativeElement.scrollTop += diff;
            this.scrollPositions[chat!.id] =
              this.messagesWrapper.nativeElement.scrollTop;
            return;
          }
        });
      })
    )
    .subscribe();

  // When selectedChat changes, scroll to the bottom.
  // Reset oldHeight to the height of the new chat. When newHeight changes, it can calculate with this height.
  // Trigger a scroll event to load more messages if the initially loaded ones don't fill the screen.
  private scrollToBottomOnNewChatSubscription = this.selectedChat$
    .pipe(
      filter((chat) => !!this.messagesWrapper && this.oldChat?.id != chat?.id),
      tap((chat) => {
        setTimeout(() => {
          if (this.scrollPositions[chat!.id] == undefined) {
            this.messagesWrapper.nativeElement.scrollTop =
              this.messagesWrapper.nativeElement.scrollHeight;
            this.scrollPositions[chat!.id] =
              this.messagesWrapper.nativeElement.scrollHeight;
            this.messagesWrapper.nativeElement.dispatchEvent(
              new Event('scroll')
            );
          } else {
            this.messagesWrapper.nativeElement.scrollTop =
              this.scrollPositions[chat!.id]!;
          }
          this.oldHeight = this.messagesWrapper.nativeElement.scrollHeight;
          this.oldChat = { ...chat } as Chat;
        }, 0);
      })
    )
    .subscribe();

  protected scrollToBottom() {
    this.messagesWrapper.nativeElement.scrollTop =
      this.messagesWrapper.nativeElement.scrollHeight;

    this.messagesWrapper.nativeElement.dispatchEvent(new Event('scroll'));
  }

  //#endregion

  private resizeObserver: ResizeObserver = new ResizeObserver(() =>
    this.ngZone.run(() => this.updateScrollDownWidth())
  );
  protected messagesWrapperWidth!: number;

  updateScrollDownWidth() {
    this.messagesWrapperWidth = this.messagesWrapper.nativeElement.clientWidth;
  }
  ngOnDestroy() {
    this.maintainScrollSubscription.unsubscribe();
    this.scrollToBottomOnNewChatSubscription.unsubscribe();
    this.resizeObserver.disconnect();
  }
}
