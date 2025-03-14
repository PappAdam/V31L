import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, NgClass],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  tabs = ['settings', 'add', 'search'];
  activeTab = '';

  selectTab(tab: string): void {
    this.activeTab = tab;
  }
}
