import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-group-option-card',
  imports: [MatIconModule],
  templateUrl: './group-option-card.component.html',
  styleUrl: './group-option-card.component.scss',
})
export class GroupOptionCardComponent {
  @Input() label: string = '';
  @Input() fontIcon: string = '';

  isExpanded: boolean = true;
  hasContent = true;
  @ViewChild('content', { read: ElementRef })
  content!: ElementRef;

  @Output() toggleChange = new EventEmitter<boolean>();

  ngAfterViewInit() {
    this.hasContent = this.content.nativeElement.children.length > 0;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    this.toggleChange.emit(this.isExpanded);
  }
}
