import { Injectable } from '@angular/core';
import { Device, DeviceInfo } from '@capacitor/device';

@Injectable({
  providedIn: 'root',
})

// there are 3 type of devices
// ios / android / web
export class PlatformService {
  private deviceInfo: DeviceInfo | null = null;

  constructor() {
    this.loadDeviceInfo();
  }

  async loadDeviceInfo() {
    this.deviceInfo = await Device.getInfo();
    this.deviceInfo.platform = 'web';
    return this.deviceInfo;
  }

  get info(): DeviceInfo | null {
    return this.deviceInfo;
  }
}
