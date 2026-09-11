import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/models';
import { ApiService } from './core/services/api.service';
import { extraireMessageErreur } from './core/utils/error-utils';

@Component({
    selector: 'app-root',
    imports: [RouterModule, FormsModule],
    template: `
    <!-- IF NOT AUTHENTICATED -> DISPLAY ROUTER OUTLET (LOGIN) -->
    @if (!isAuthenticated) {
      <div>
        <router-outlet></router-outlet>
      </div>
    }
    
    <!-- IF AUTHENTICATED -> DISPLAY FULL DASHBOARD LAYOUT -->
    @if (isAuthenticated) {
      <div class="app-container">
        <!-- OVERLAY (mobile) : referme la barre latérale au clic à l'extérieur -->
        @if (sidebarOpen) {
          <div class="sidebar-backdrop" (click)="sidebarOpen = false"></div>
        }
        <!-- ZONE DE SURVOL : ramène le curseur sur le bord gauche pour rouvrir -->
        @if (!sidebarOpen) {
          <div class="sidebar-hover-zone" (mouseenter)="sidebarOpen = true"></div>
        }
        <!-- SIDEBAR -->
        <aside class="sidebar" [class.open]="sidebarOpen">
          <div class="sidebar-brand">
            <div class="brand-icon">
              @if (logoData) {
                <img [src]="logoData" alt="Logo de l'entreprise" />
              }
              @if (!logoData) {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h1.5l1-3.5h9l1 3.5H19M5 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M5 17V11l2-5h10l2 5v6"/><circle cx="7.5" cy="14.5" r="0.6" fill="#ffffff" stroke="none"/><circle cx="16.5" cy="14.5" r="0.6" fill="#ffffff" stroke="none"/></svg>
              }
            </div>
            <div class="brand-text">
              <h2>Nerwaya</h2>
              <span>Auto-École</span>
            </div>
          </div>
          <nav class="sidebar-nav" (click)="sidebarOpen = false">
            <div class="nav-section-title">Principal</div>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <svg class="nav-icon icon-blue" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
              <span>Tableau de bord</span>
            </a>
            <div class="nav-section-title">Gestion Métier</div>
            @if (hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR'])) {
              <a routerLink="/candidats" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-violet" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Candidats</span>
              </a>
            }
            @if (hasRole(['ADMIN', 'CAISSIERE', 'SECRETAIRE'])) {
              <a routerLink="/paiements" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <span>Paiements & Reçus</span>
              </a>
            }
            @if (hasRole(['ADMIN', 'MONITEUR', 'SECRETAIRE'])) {
              <a routerLink="/examens" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-amber" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5"/><path d="M2 9v5"/></svg>
                <span>Examens & Épreuves</span>
              </a>
            }
            @if (hasRole(['ADMIN', 'CAISSIERE'])) {
              <a routerLink="/caisse" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-teal" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
                <span>Caisse & Trésorerie</span>
              </a>
            }
            @if (hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE'])) {
              <a routerLink="/rapports" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-indigo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>Rapports & Exports</span>
              </a>
            }
            @if (hasRole(['ADMIN'])) {
              <div class="nav-section-title">Administration</div>
            }
            @if (hasRole(['ADMIN'])) {
              <a routerLink="/utilisateurs" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-rose" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                <span>Comptes Utilisateurs</span>
              </a>
            }
            @if (hasRole(['ADMIN'])) {
              <a routerLink="/parametrage" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                <span>Paramétrage</span>
              </a>
            }
            @if (hasRole(['ADMIN'])) {
              <a routerLink="/audit" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-red" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                <span>Journal d'Audit</span>
              </a>
            }
          </nav>
          <!-- FOOTER USER PROFILE -->
          <div class="sidebar-footer">
            <div class="user-profile-widget">
              <div class="user-avatar">
                @if (currentUser?.photoProfile) {
                  <img [src]="$safeNavigationMigration(currentUser?.photoProfile)" alt="Photo de profil" />
                }
                @if (!currentUser?.photoProfile) {
                  <span>{{ userInitials }}</span>
                }
              </div>
              <div class="user-meta">
                <div class="user-name">{{ currentUser?.nom }} {{ currentUser?.prenom }}</div>
                <div class="user-role-badge">{{ currentUser?.role }}</div>
              </div>
              <button class="btn btn-sm btn-icon sidebar-footer-btn" (click)="showProfileModal = true" title="Modifier la photo de profil">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <button class="btn btn-sm btn-icon sidebar-footer-btn" (click)="logout()" title="Déconnexion">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
        </aside>
        <!-- MAIN CONTENT WRAPPER -->
        <div class="main-wrapper" [class.sidebar-closed]="!sidebarOpen">
          <!-- TOPBAR -->
          <header class="topbar">
            <div style="display:flex; align-items:center; gap:0.85rem;">
              <button class="sidebar-toggle-btn" (click)="sidebarOpen = !sidebarOpen" aria-label="Afficher/masquer le menu">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div class="page-title">
                <h1>Nerwaya Auto-École</h1>
                <p>Plateforme Web Centralisée • Gestion Administrative & Financière</p>
              </div>
            </div>
            <div class="topbar-actions">
              <button class="btn btn-outline btn-sm" (click)="showPasswordModal = true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Mot de passe
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
        @if (showPasswordModal) {
          <div class="modal-backdrop">
            <div class="modal-content">
              <div class="modal-header">
                <h3 style="display:flex; align-items:center; gap:0.5rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Changer mon mot de passe
                </h3>
                <button class="btn btn-outline btn-sm" (click)="showPasswordModal = false">✕</button>
              </div>
              <form (ngSubmit)="changePassword()">
                <div class="modal-body">
                  @if (pwdError) {
                    <div class="alert alert-danger">⚠️ {{ pwdError }}</div>
                  }
                  @if (pwdSuccess) {
                    <div class="alert alert-success">✅ Mot de passe modifié avec succès.</div>
                  }
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
        }
        @if (showProfileModal) {
          <div class="modal-backdrop">
            <div class="modal-content">
              <div class="modal-header">
                <h3 style="display:flex; align-items:center; gap:0.5rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>
                  Photo de profil
                </h3>
                <button class="btn btn-outline btn-sm" (click)="showProfileModal = false">✕</button>
              </div>
              <div class="modal-body">
                <div class="profile-preview">
                  @if (currentUser?.photoProfile) {
                    <img [src]="$safeNavigationMigration(currentUser?.photoProfile)" alt="Photo actuelle" />
                  }
                  @if (!currentUser?.photoProfile) {
                    <span>{{ userInitials }}</span>
                  }
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onProfilePhotoSelected($event)" />
                <p class="form-help">Image JPG, PNG ou WebP, maximum 2 Mo.</p>
                @if (profileError) {
                  <div class="alert alert-danger">{{ profileError }}</div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showProfileModal = false">Fermer</button>
              </div>
            </div>
          </div>
        }
      </div>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    /* Boutons du pied de barre latérale (photo, déconnexion) : sur fond sombre,
       .btn-outline (pensé pour un fond clair) rendait les icônes illisibles. */
    .sidebar-footer-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }

    .sidebar-footer-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }

    .sidebar-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      border: none;
      background: transparent;
      color: var(--text-main);
      border-radius: var(--radius-md);
      cursor: pointer;
      flex-shrink: 0;
    }

    .sidebar-toggle-btn:hover {
      background: var(--bg-main);
    }

    /* La barre latérale se replie hors champ dès qu'elle n'est pas ouverte,
       quelle que soit la largeur de l'écran. */
    .sidebar {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    /* Sur un écran large, le contenu récupère la place libérée par la
       barre repliée ; sur écran étroit elle reste en survol (voir plus bas). */
    .main-wrapper {
      transition: margin-left var(--transition-normal);
    }

    .main-wrapper.sidebar-closed {
      margin-left: 0;
    }

    /* Fine bande invisible collée au bord gauche : y ramener le curseur
       rouvre la barre latérale sans avoir à cliquer sur le bouton. */
    .sidebar-hover-zone {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      width: 14px;
      z-index: 41;
    }

    .sidebar-backdrop {
      display: none;
    }

    /* Écrans étroits : la barre latérale glisse toujours par-dessus le
       contenu (jamais en poussant), avec un fond assombri pour la refermer. */
    @media (max-width: 960px) {
      .main-wrapper {
        margin-left: 0 !important;
      }

      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        z-index: 39;
      }
    }

    .nav-item.active {
      background: linear-gradient(90deg, #1e40af, #2563eb);
      color: #ffffff;
      font-weight: 600;
    }

    /* Icônes de la navigation : chaque rubrique a sa propre couleur au repos,
       et devient blanche lorsque son lien est actif (fond bleu). */
    .nav-icon { flex-shrink: 0; }
    .icon-blue { color: #2563eb; }
    .icon-violet { color: #8b5cf6; }
    .icon-green { color: #10b981; }
    .icon-amber { color: #f59e0b; }
    .icon-teal { color: #0d9488; }
    .icon-indigo { color: #6366f1; }
    .icon-rose { color: #ec4899; }
    .icon-slate { color: #94a3b8; }
    .icon-red { color: #ef4444; }
    .nav-item.active .nav-icon { color: #ffffff; }

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
  sidebarOpen = true;
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
      error: err => this.profileError = extraireMessageErreur(err, 'Impossible de modifier la photo.')
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
        this.pwdError = extraireMessageErreur(err, 'Erreur lors du changement de mot de passe.');
      }
    });
  }
}
