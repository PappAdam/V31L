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

@Component({
  selector: 'app-group-option-card',
  imports: [MatIconModule, MatRippleModule],
  templateUrl: './group-option-card.component.html',
  styleUrl: './group-option-card.component.scss',
})
export class GroupOptionCardComponent {
  @Input() label: string = '';
  @Input() fontIcon: string = '';

  isExpanded: boolean = false;
  hasContent = true;
  @ViewChild('content', { read: ElementRef })
  content!: ElementRef;

  @Output() expanded = new EventEmitter<void>();

  ngAfterViewInit() {
    this.hasContent = this.content.nativeElement.children.length > 0;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.expanded.emit();
    }
  }
}
