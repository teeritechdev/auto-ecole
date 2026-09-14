import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data?.['roles'] as Array<string>;
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (authService.hasRole(expectedRoles)) {
    return true;
  }

  router.navigate([authService.hasRole(['CANDIDAT']) ? '/espace-candidat' : '/dashboard']);
  return false;
};

/**
 * Un compte CANDIDAT dont le mot de passe temporaire n'a pas encore été changé est
 * redirigé vers l'écran de changement de mot de passe avant tout accès à son espace.
 */
export const mustChangePasswordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUserValue?.doitChangerMotDePasse) {
    router.navigate(['/premiere-connexion']);
    return false;
  }
  return true;
};
