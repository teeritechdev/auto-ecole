import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/models';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- IF NOT AUTHENTICATED -> DISPLAY ROUTER OUTLET (LOGIN) -->
    <div *ngIf="!isAuthenticated">
      <router-outlet></router-outlet>
    </div>

    <!-- IF AUTHENTICATED -> DISPLAY FULL DASHBOARD LAYOUT -->
    <div class="app-container" *ngIf="isAuthenticated">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">
            <img *ngIf="logoData" [src]="logoData" alt="Logo de l'entreprise" />
            <span *ngIf="!logoData">🚗</span>
          </div>
          <div class="brand-text">
            <h2>Nerwaya</h2>
            <span>Auto-École</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">Principal</div>
          
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Tableau de bord</span>
          </a>

          <div class="nav-section-title">Gestion Métier</div>

          <a routerLink="/candidats" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR'])">
            <span class="nav-icon">👥</span>
            <span>Candidats & Dossiers</span>
          </a>

          <a routerLink="/paiements" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN', 'CAISSIERE', 'SECRETAIRE'])">
            <span class="nav-icon">💵</span>
            <span>Paiements & Reçus</span>
          </a>

          <a routerLink="/examens" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN', 'MONITEUR', 'SECRETAIRE'])">
            <span class="nav-icon">🎓</span>
            <span>Examens & Épreuves</span>
          </a>

          <a routerLink="/caisse" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN', 'CAISSIERE'])">
            <span class="nav-icon">🏦</span>
            <span>Caisse & Trésorerie</span>
          </a>

          <a routerLink="/rapports" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE'])">
            <span class="nav-icon">📑</span>
            <span>Rapports & Exports</span>
          </a>

          <div class="nav-section-title" *ngIf="hasRole(['ADMIN'])">Administration</div>

          <a routerLink="/utilisateurs" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN'])">
            <span class="nav-icon">👤</span>
            <span>Comptes Utilisateurs</span>
          </a>

          <a routerLink="/parametrage" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN'])">
            <span class="nav-icon">⚙️</span>
            <span>Paramétrage Forfaits</span>
          </a>

          <a routerLink="/audit" routerLinkActive="active" class="nav-item" *ngIf="hasRole(['ADMIN'])">
            <span class="nav-icon">🛡️</span>
            <span>Journal d'Audit</span>
          </a>
        </nav>

        <!-- FOOTER USER PROFILE -->
        <div class="sidebar-footer">
          <div class="user-profile-widget">
            <div class="user-avatar">
              <img *ngIf="currentUser?.photoProfile" [src]="currentUser?.photoProfile" alt="Photo de profil" />
              <span *ngIf="!currentUser?.photoProfile">{{ userInitials }}</span>
            </div>
            <div class="user-meta">
              <div class="user-name">{{ currentUser?.nom }} {{ currentUser?.prenom }}</div>
              <div class="user-role-badge">{{ currentUser?.role }}</div>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" (click)="showProfileModal = true" title="Modifier la photo de profil">
              📷
            </button>
            <button class="btn btn-outline btn-sm btn-icon" (click)="logout()" title="Déconnexion">
              🚪
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="main-wrapper">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="page-title">
            <h1>Nerwaya Auto-École</h1>
            <p>Plateforme Web Centralisée • Gestion Administrative & Financière</p>
          </div>

          <div class="topbar-actions">
            <button class="btn btn-outline btn-sm" (click)="showPasswordModal = true">
              🔒 Mot de passe
            </button>
            <button class="btn btn-danger btn-sm" (click)="logout()">
              Déconnexion
            </button>
          </div>
        </header>

        <!-- CONTENT ROUTER OUTLET -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- MODAL CHANGER MOT DE PASSE -->
      <div class="modal-backdrop" *ngIf="showPasswordModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🔒 Changer mon mot de passe</h3>
            <button class="btn btn-outline btn-sm" (click)="showPasswordModal = false">✕</button>
          </div>
          <form (ngSubmit)="changePassword()">
            <div class="modal-body">
              <div *ngIf="pwdError" class="alert alert-danger">⚠️ {{ pwdError }}</div>
              <div *ngIf="pwdSuccess" class="alert alert-success">✅ Mot de passe modifié avec succès.</div>

              <div class="form-group">
                <label class="form-label">Ancien mot de passe <span class="required">*</span></label>
                <input type="password" class="form-control" [(ngModel)]="ancienPwd" name="ancien" required />
              </div>
              <div class="form-group">
                <label class="form-label">Nouveau mot de passe <span class="required">*</span></label>
                <input type="password" class="form-control" [(ngModel)]="nouveauPwd" name="nouveau" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showPasswordModal = false">Fermer</button>
              <button type="submit" class="btn btn-primary" [disabled]="!ancienPwd || !nouveauPwd">Valider</button>
            </div>
          </form>
        </div>
      </div>

      <div class="modal-backdrop" *ngIf="showProfileModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📷 Photo de profil</h3>
            <button class="btn btn-outline btn-sm" (click)="showProfileModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="profile-preview">
              <img *ngIf="currentUser?.photoProfile" [src]="currentUser?.photoProfile" alt="Photo actuelle" />
              <span *ngIf="!currentUser?.photoProfile">{{ userInitials }}</span>
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onProfilePhotoSelected($event)" />
            <p class="form-help">Image JPG, PNG ou WebP, maximum 2 Mo.</p>
            <div *ngIf="profileError" class="alert alert-danger">{{ profileError }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showProfileModal = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-item.active {
      background: linear-gradient(90deg, #1e40af, #2563eb);
      color: #ffffff;
      font-weight: 600;
    }

    .user-avatar, .profile-preview {
      overflow: hidden;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2563eb;
      color: #fff;
      font-weight: 700;
    }

    .user-avatar { width: 2.4rem; height: 2.4rem; }
    .brand-icon { overflow: hidden; }
    .brand-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 0.6rem; }
    .profile-preview { width: 7rem; height: 7rem; margin-bottom: 1rem; font-size: 2rem; }
    .user-avatar img, .profile-preview img { width: 100%; height: 100%; object-fit: cover; }
    .form-help { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem; }
  `]
})
export class AppComponent {
  showPasswordModal = false;
  showProfileModal = false;
  ancienPwd = '';
  nouveauPwd = '';
  pwdError = '';
  pwdSuccess = false;
  profileError = '';
  logoData: string | null = null;

  constructor(public authService: AuthService, private router: Router, private apiService: ApiService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.apiService.getLogo().subscribe({ next: response => this.logoData = response.logoData });
      }
    });
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser(): User | null {
    return this.authService.currentUserValue;
  }

  get userInitials(): string {
    const u = this.currentUser;
    if (!u) return 'U';
    const n = u.nom ? u.nom[0] : '';
    const p = u.prenom ? u.prenom[0] : '';
    return (n + p).toUpperCase() || 'U';
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  logout(): void {
    this.authService.logout();
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.profileError = 'La photo ne doit pas dépasser 2 Mo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.authService.updateMyPhoto(reader.result as string).subscribe({
      next: () => { this.profileError = ''; },
      error: err => this.profileError = err.error?.message || 'Impossible de modifier la photo.'
    });
    reader.readAsDataURL(file);
  }

  changePassword(): void {
    this.pwdError = '';
    this.pwdSuccess = false;

    this.authService.changePassword({
      ancienPassword: this.ancienPwd,
      nouveauPassword: this.nouveauPwd
    }).subscribe({
      next: () => {
        this.pwdSuccess = true;
        this.ancienPwd = '';
        this.nouveauPwd = '';
        setTimeout(() => this.showPasswordModal = false, 1500);
      },
      error: (err) => {
        this.pwdError = err.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }
}
