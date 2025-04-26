import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { QRcodeComponent } from '../../../qrcode/qrcode.component';
import { AuthService } from '@/services/auth.service';

@Component({
  selector: 'app-setup',
  imports: [MatButtonModule, QRcodeComponent],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class MfaSetupComponent {
  setupCode: string;
  authService = inject(AuthService);

  constructor(private router: Router) {
    const setupCode =
      this.router.getCurrentNavigation()?.extras.state?.['setupCode'];

    console.info(setupCode);

    if (!setupCode) {
      throw new Error('No setup code provided!');
    }

    this.setupCode = setupCode;
  }

  onNextClick() {}
}
