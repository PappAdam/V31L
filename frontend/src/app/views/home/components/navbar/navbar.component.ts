import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

export interface ActiveTab {
  index: number;
  name: string;
}

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, NgClass],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  tabs = ['settings', 'add', 'search'];
  activeTab = {} as ActiveTab;
  @Output() activeTabChanged = new EventEmitter<ActiveTab>();
  selectTab(tab: string): void {
    this.activeTab = { index: this.tabs.indexOf(tab), name: tab };

    this.activeTabChanged.emit(this.activeTab);
  }
}
