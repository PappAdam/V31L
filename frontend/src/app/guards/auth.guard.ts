import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.user?.token) return false;

  const payloadBase64 = authService.user.token.split('.')[1]; // Extract payload
  const payloadDecoded = atob(payloadBase64); // Decode Base64
  const tokenPayload = JSON.parse(payloadDecoded);

  if (!tokenPayload) {
    router.navigateByUrl('/login');
    return false;
  }

  const timeSinceIssueSeconds = Date.now() / 1000 - tokenPayload.iat;

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
