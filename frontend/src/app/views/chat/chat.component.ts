import { PlatformService } from '@/services/platform.service';
import {
  Component,
  ElementRef,
  inject,
  Input,
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
import { MessageService } from '@/services/message.service';
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

  // If the scroll is near the top (tolerance is given in px), load more messages.
  // This controls the `loadingMessages` boolean.
  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const tolerance = 1;

    if (element.scrollTop <= tolerance && !this.loadingMessages) {
      this.loadingMessages = true;
      this.messageService
        .scrollLoadMessages(this.messageService.selectedChatId)
        .then(() => (this.loadingMessages = false));
    }

    this.scrolledToBottom =
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - tolerance;
  }

  // The height of the element before a redraw.
  private oldHeight = 0;
  ngAfterViewInit() {
    this.oldHeight = this.messagesWrapper.nativeElement.scrollHeight;
  }
  // The height of the element after a redraw.
  private newHeight$ = new Subject<number>();

  // When a new message arrives (chat is unchanged, only messages update), update newHeight.
  private trackHeightSubscription = this.selectedChat$
    .pipe(
      pairwise(),
      filter(
        ([oldChat, newChat]) =>
          !!this.messagesWrapper && oldChat?.id === newChat?.id
      ),
      tap(() => {
        requestAnimationFrame(() => {
          this.newHeight$.next(this.messagesWrapper.nativeElement.scrollHeight);
        });
      })
    )
    .subscribe();

  // When selectedChat changes, scroll to the bottom.
  // Reset oldHeight to the height of the new chat. When newHeight changes, it can calculate with this height.
  // Trigger a scroll event to load more messages if the initially loaded ones don't fill the screen.
  private scrollToBottomOnNewChatSubscription = this.selectedChat$
    .pipe(
      pairwise(),
      filter(
        ([oldChat, newChat]) =>
          !!this.messagesWrapper && oldChat?.id != newChat?.id
      ),
      tap(() => {
        setTimeout(() => {
          this.messagesWrapper.nativeElement.scrollTop =
            this.messagesWrapper.nativeElement.scrollHeight;
          this.oldHeight = this.messagesWrapper.nativeElement.scrollHeight;
          this.scrolledToBottom = true;
          this.messagesWrapper.nativeElement.dispatchEvent(new Event('scroll'));
        }, 0);
      })
    )
    .subscribe();

  // Whenever newHeight changes, adjust scrollTop to keep the view's position the same.
  // This controls the oldHeight variable.
  private maintainScrollSubscription = this.newHeight$
    .pipe(
      tap((newHeight) => {
        const diff = newHeight - this.oldHeight;
        this.oldHeight = newHeight;
        this.messagesWrapper.nativeElement.scrollTop += diff;
      })
    )
    .subscribe();
  //#endregion Scrolling

  ngOnDestroy() {
    this.trackHeightSubscription.unsubscribe();
    this.scrollToBottomOnNewChatSubscription.unsubscribe();
    this.maintainScrollSubscription.unsubscribe();
  }
}
