import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

export interface ActiveTab {
  index: number;
  name: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  tabs = ['settings', 'messages', 'add'];
}
