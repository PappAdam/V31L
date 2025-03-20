import { Component, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-header',
  imports: [MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  state: string = 'closed';
  @Output() detailsStateEvent = new EventEmitter<string>();

  openDetails() {
    if (this.state == 'closed') {
      this.state = 'open';
    } else {
      this.state = 'closed';
    }

    this.detailsStateEvent.emit(this.state);
  }
}
