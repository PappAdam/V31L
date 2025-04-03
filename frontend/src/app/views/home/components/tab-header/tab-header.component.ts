import { Component, Input, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-header',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './tab-header.component.html',
  styleUrl: './tab-header.component.scss',
})
export class TabHeaderComponent {
  @Input() Title: string = '';
  constructor(private router: Router) {}

  Back(): void {
    this.router.navigate(['/side', { outlets: { home: 'messages' } }]);
  }
}
