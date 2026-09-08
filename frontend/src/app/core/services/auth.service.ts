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
        this.currentUserSubject.next(JSON.parse(savedUser));
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
    return this.http.post<void>(`${this.apiUrl}/change-password`, data);
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
}
