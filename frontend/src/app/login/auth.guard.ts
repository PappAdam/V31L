import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.tokenPayload) return false;

  const timeSinceIssueSeconds =
    Date.now() / 1000 - authService.tokenPayload.iat;

  // Refresh token if it is older than 60 seconds
  if (timeSinceIssueSeconds > 60) {
    const refreshedToken = await authService.refreshToken();
    if (!refreshedToken) {
      router.navigateByUrl('/login');
      return false;
    }
  }

  return true;
};
