import { PlatformService } from '@/services/platform.service';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

export const platformGuard: CanActivateFn = async (route, state) => {
  const platformService = inject(PlatformService);

  try {
    await platformService.loadDeviceInfo();
  } catch (error) {}
  return true;
};
