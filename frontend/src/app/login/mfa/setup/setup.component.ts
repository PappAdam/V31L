import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { QRcodeComponent } from '../../../qrcode/qrcode.component';

@Component({
  selector: 'app-setup',
  imports: [MatButtonModule, QRcodeComponent],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class MfaSetupComponent {
  setupCode: string;

  constructor(private router: Router) {
    const setupCode =
      this.router.getCurrentNavigation()?.extras.state?.['setupCode'];

    console.info(setupCode);

    if (!setupCode) {
      throw new Error('No setup code provided!');
    }

    this.setupCode = setupCode;
  }

  onNextClick() {
    this.router.navigate([`/login`]);
  }
}
