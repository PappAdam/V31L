import { AuthService } from '@/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map, tap } from 'rxjs';
import { GroupOptionCardComponent } from '../../../chat/components/details/components/group-option-card/group-option-card.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-settings',
  imports: [AsyncPipe, GroupOptionCardComponent, MatDividerModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  authService = inject(AuthService);

  username$ = this.authService.user$.pipe(map((u) => u?.username));
}
