import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Le token ne doit jamais être envoyé à un domaine autre que notre propre
  // API (évite toute fuite du JWT vers un service tiers).
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  let authReq = req;
  if (token && isApiRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Déconnexion locale uniquement : le serveur a déjà rejeté ce token,
        // un appel à /auth/logout ici provoquerait une boucle infinie.
        authService.localLogout();
      }
      return throwError(() => error);
    })
  );
};
