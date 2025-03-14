import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-message',
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  @Input() sender: string = '';
  @Input() first: string = '';
  @Input({ required: true }) msg: string = '';
}
