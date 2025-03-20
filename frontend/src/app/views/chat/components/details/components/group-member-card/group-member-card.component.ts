import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-group-member-card',
  imports: [MatIconModule],
  templateUrl: './group-member-card.component.html',
  styleUrl: './group-member-card.component.scss',
})
export class GroupMemberCardComponent {
  @Input() name: string = '';
}
