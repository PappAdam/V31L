import { Component, inject, Input } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { GroupOptionCardComponent } from './components/group-option-card/group-option-card.component';
import { GroupMemberCardComponent } from './components/group-member-card/group-member-card.component';
import { PlatformService } from '@/services/platform.service';
import { DeviceInfo } from '@capacitor/device';
GroupMemberCardComponent;
@Component({
  selector: 'app-details',
  imports: [
    MatIconModule,
    MatIcon,
    GroupOptionCardComponent,
    GroupMemberCardComponent,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent {
  protected platformService = inject(PlatformService);
  platform: DeviceInfo | null = null;
  constructor() {
    this.platform = this.platformService.info;
  }
  @Input() state: string = 'closed';
}
