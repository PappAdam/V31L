import { Component, Input } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qrcode',
  imports: [],
  templateUrl: './qrcode.component.html',
  styleUrl: './qrcode.component.scss',
})
export class QRcodeComponent {
  @Input() from?: string;
  url? = '';

  constructor() {}

  ngOnInit() {
    this.generateQrCode();
  }

  protected async generateQrCode() {
    if (!this.from) {
      this.url = undefined;
      return;
    }

    const darkColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--mat-sys-primary');
    const lightColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--mat-sys-background');

    this.url = await QRCode.toDataURL(this.from, {
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });
  }
}
