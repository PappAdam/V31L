import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Returns null if no token is stored
  const refreshedToken = await authService.refreshToken();
  if (!refreshedToken) {
    router.navigateByUrl('/login');
    return false;
  }

  return true;
};
