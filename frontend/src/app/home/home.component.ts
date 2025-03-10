import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MessageService } from '@/services/message.service';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  take,
  first,
} from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  imports: [
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected messageService = inject(MessageService);
  protected authService = inject(AuthService);

  selectedChatIndex$ = new BehaviorSubject<number>(-1);
  chatMessages$ = this.messageService.messages$;
  selectedChatContent$ = combineLatest([
    this.chatMessages$,
    this.selectedChatIndex$,
  ]).pipe(map(([messages, index]) => messages[index]));

  messageControl = new FormControl('');

  constructor() {
    this.chatMessages$
      .pipe(
        first(),
        tap(() => this.selectedChatIndex$.next(0))
      )
      .subscribe();
  }

  async sendMessage() {
    const message = this.messageControl.value?.trim();
    console.log(this.selectedChatIndex$.value);
    if (!message || this.selectedChatIndex$.value == -1) return;
    const selectedChat = await firstValueFrom(
      this.selectedChatContent$.pipe(take(1))
    );
    this.messageService.sendMessage(selectedChat.chat.id, message);
    this.messageControl.reset();
  }
}
