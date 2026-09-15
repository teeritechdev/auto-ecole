import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/models';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        // Session mise en cache avant l'introduction des permissions dynamiques (ou après
        // modification du profil d'un utilisateur déjà connecté) : sans permissions à jour,
        // la barre latérale masquerait tous les boutons. On force une reconnexion propre
        // plutôt que de laisser l'utilisateur avec un menu vide sans explication.
        if (!user.permissions) {
          this.clearLocalSession();
          return;
        }
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.currentUserValue?.token || localStorage.getItem('jwtToken');
  }

  public login(credentials: { username: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap(user => {
        if (user && user.token) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('jwtToken', user.token);
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  public changePassword(data: { ancienPassword: string; nouveauPassword: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, data).pipe(
      tap(() => {
        const current = this.currentUserValue;
        if (current) {
          const updatedUser = { ...current, doitChangerMotDePasse: false };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  public updateMyPhoto(photoProfile: string | null): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/utilisateurs/me/photo`, { photoProfile }).pipe(
      tap(user => {
        const current = this.currentUserValue;
        const updatedUser = { ...current, ...user, token: current?.token } as User;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  /** Déconnexion explicite (action utilisateur) : révoque le token côté serveur. */
  public logout(): void {
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({
      complete: () => this.clearLocalSession(),
      error: () => this.clearLocalSession()
    });
  }

  /**
   * Déconnexion locale uniquement, sans appel réseau — utilisée par
   * l'intercepteur HTTP en réaction à un 401 (le token est déjà rejeté par
   * le serveur, un appel à /auth/logout provoquerait une boucle infinie).
   */
  public localLogout(): void {
    this.clearLocalSession();
  }

  private clearLocalSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwtToken');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public hasRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.includes(user.role);
  }

  /** Vrai si l'utilisateur connecté dispose d'au moins une des permissions données
   *  (cf. onglet Permissions de Paramétrage, qui détermine dynamiquement cette liste). */
  public hasPermission(permissions: string[]): boolean {
    const user = this.currentUserValue;
    if (!user || !user.permissions) return false;
    return permissions.some(p => user.permissions!.includes(p));
  }
}
