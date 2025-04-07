import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-group-option-card',
  imports: [MatIconModule, MatRippleModule, MatSlideToggleModule],
  templateUrl: './group-option-card.component.html',
  styleUrl: './group-option-card.component.scss',
})
export class GroupOptionCardComponent {
  @Input() label: string = '';
  @Input() fontIcon: string = '';
  @Input() type: 'button' | 'expand' | 'toggle' = 'button';

  isActivated: boolean = false;
  @ViewChild('content', { read: ElementRef })
  content!: ElementRef;

  @Output() expanded = new EventEmitter<void>();

  toggle() {
    this.isActivated = !this.isActivated;
    if (this.isActivated) {
      this.expanded.emit();
    }
  }
}
