import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private socketService = inject(SocketService)

  public decryptedMessages = this.socketService.getPackagesForHeader("Chats").pipe(
    map(chats => {
      return chats[0]
    })
  )

  constructor() { }

  encryptText() {

  }

  decryptText() {

  }
}
