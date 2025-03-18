import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import QRCode from 'qrcode';

@Component({
  selector: 'app-setup',
  imports: [MatButtonModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class MfaSetupComponent {
  setupCode: string;
  qrCodeUrl = signal('');

  constructor(private router: Router) {
    const setupCode =
      this.router.getCurrentNavigation()?.extras.state?.['setupCode'];

    if (!setupCode) {
      throw new Error('No setup code provided!');
    }

    this.setupCode = setupCode;
    this.generateQrUrl();
  }

  private async generateQrUrl() {
    const darkColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--mat-sys-primary');
    const lightColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--mat-sys-background');

    this.qrCodeUrl.set(
      await QRCode.toDataURL(this.setupCode, {
        width: 250,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      })
    );
  }

  onNextClick() {
    this.router.navigate([`/login/mfa/verify`]);
  }
}
