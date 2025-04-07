import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qrcode',
  imports: [],
  templateUrl: './qrcode.component.html',
  styleUrl: './qrcode.component.scss',
})
export class QRcodeComponent implements OnChanges {
  @Input() from?: string;
  url?: string;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['from']) {
      this.generateQrCode();
    }
  }

  private async generateQrCode() {
    if (!this.from) {
      this.url = undefined;
      return;
    }

    const darkColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--mat-sys-primary');
    const lightColor = '#00000000';

    this.url = await QRCode.toDataURL(this.from, {
      errorCorrectionLevel: 'H',
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });
  }
}
