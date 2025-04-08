import { Component, EventEmitter, Input, model, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-group-option-card',
  standalone: true,
  imports: [MatIconModule, MatRippleModule, MatSlideToggleModule],
  templateUrl: './group-option-card.component.html',
  styleUrl: './group-option-card.component.scss',
})
export class GroupOptionCardComponent {
  @Input() label: string = '';
  @Input() fontIcon: string = '';
  @Input() type: 'button' | 'expand' | 'toggle' = 'button';
  isActivated = model(false);

  @Output() activated = new EventEmitter<boolean>();
  @Output() expanded = new EventEmitter<void>();

  toggle() {
    this.isActivated.update((a) => !a);
    this.activated.emit(this.isActivated());
    if (this.isActivated()) {
      this.expanded.emit();
    }
  }
}
