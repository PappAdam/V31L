import { PlatformService } from '@/services/platform.service';
import { Component, inject } from '@angular/core';
import { DeviceInfo } from '@capacitor/device';
import { HomeComponent } from '@/views/home/home.component';
import { ChatComponent } from '@/views/chat/chat.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-layout',
  imports: [HomeComponent, ChatComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  constructor(private router: Router) {
    this.platform = this.platformService.info;
  }
  ngOnInit() {
    this.router.navigate(['/side', { outlets: { home: 'messages' } }]);
  }
}
