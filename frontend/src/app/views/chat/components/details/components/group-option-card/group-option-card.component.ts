import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-group-option-card',
  imports: [MatIconModule],
  templateUrl: './group-option-card.component.html',
  styleUrl: './group-option-card.component.scss',
})
export class GroupOptionCardComponent {
  @Input() fontIcon: string = '';
  @Input() label: string = '';
}
