import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  @Input() sender: string = '';
  @Input() first: string = '';
  @Input() pinned: boolean = false;
  @Input({ required: true }) msg: string = '';
}
