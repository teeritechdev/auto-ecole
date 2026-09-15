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
          <div class="sidebar-backdrop" (click)="sidebarOpen = false; closeParamSubmenu()"></div>
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
            @if (!hasRole(['CANDIDAT'])) {
              <div class="nav-section-title">Principal</div>
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-blue" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                <span>Tableau de bord</span>
              </a>
            }
            @if (hasRole(['CANDIDAT'])) {
              <div class="nav-section-title">Mon espace</div>
              <a routerLink="/espace-candidat" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
                <svg class="nav-icon icon-blue" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                <span>Ma progression</span>
              </a>
              <a routerLink="/espace-candidat/historique" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-indigo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                <span>Historique Code</span>
              </a>
            }
            @if (!hasRole(['CANDIDAT'])) {
              <div class="nav-section-title">Gestion Métier</div>
            }
            @if (hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR'])) {
              <a routerLink="/candidats" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-violet" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Inscriptions</span>
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
            @if (hasRole(['ADMIN', 'MONITEUR'])) {
              <a routerLink="/code/resultats" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-amber" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5"/><path d="M2 9v5"/></svg>
                <span>Résultats Code</span>
              </a>
            }
            @if (hasRole(['ADMIN', 'MONITEUR'])) {
              <a routerLink="/parametrage-code" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                <span>Configuration Code</span>
              </a>
            }
            @if (hasRole(['ADMIN', 'CAISSIERE'])) {
              <a routerLink="/caisse" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-teal" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
                <span>Caisse Ménu Dépense</span>
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
              <div class="nav-item-flyout" [class.open]="paramSubmenuOpen"
                   (mouseenter)="openParamSubmenu($event)" (mouseleave)="scheduleCloseParamSubmenu()">
                <a routerLink="/parametrage" routerLinkActive="active" class="nav-item">
                  <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                  <span>Paramètres Généraux</span>
                </a>
                <button type="button" class="submenu-caret-btn" (click)="toggleParamSubmenu($event)" aria-label="Afficher les catégories de Paramètres Généraux">
                  <svg class="submenu-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            }
            @if (hasRole(['ADMIN'])) {
              <a routerLink="/code/questions" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
                <span>Banque de questions Code</span>
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
        <!-- SOUS-MENU "PARAMÈTRES GÉNÉRAUX" : rendu hors de <aside>/.sidebar-nav (qui a
             overflow-y:auto, forçant aussi le clipping horizontal du sous-menu positionné
             à côté) ; position calculée en JS et appliquée en position:fixed. -->
        @if (paramSubmenuOpen) {
          <div class="submenu-flyout"
               [style.top.px]="paramSubmenuTop" [style.left.px]="paramSubmenuLeft" [style.width.px]="paramSubmenuWidth"
               (mouseenter)="cancelCloseParamSubmenu()" (mouseleave)="scheduleCloseParamSubmenu()">
            <a routerLink="/parametrage" [queryParams]="{tab: 'identite'}" class="submenu-item" (click)="closeParamSubmenu()">Identité</a>
            <a routerLink="/parametrage" [queryParams]="{tab: 'categories'}" class="submenu-item" (click)="closeParamSubmenu()">Catégories de Permis</a>
            <a routerLink="/parametrage" [queryParams]="{tab: 'tarifs'}" class="submenu-item" (click)="closeParamSubmenu()">Tarifs des Examens</a>
            <a routerLink="/parametrage" [queryParams]="{tab: 'sites'}" class="submenu-item" (click)="closeParamSubmenu()">Sites de Formation</a>
            <a routerLink="/parametrage" [queryParams]="{tab: 'stats'}" class="submenu-item" (click)="closeParamSubmenu()">Statistiques par Site</a>
          </div>
        }
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
              <button class="btn btn-outline btn-sm" (click)="showPasswordModal = true" title="Mot de passe">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span class="btn-label">Mot de passe</span>
              </button>
              <button class="btn btn-danger btn-sm" (click)="logout()" title="Déconnexion">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span class="btn-label">Déconnexion</span>
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
                    <div class="alert alert-danger">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      {{ pwdError }}
                    </div>
                  }
                  @if (pwdSuccess) {
                    <div class="alert alert-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Mot de passe modifié avec succès.
                    </div>
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
    /* Boutons du pied de barre latérale (photo, déconnexion) : n'ont pas de classe
       .btn-outline/.btn-primary (juste .btn-icon), donc sans cette couleur ils resteraient
       transparents avec le texte par défaut du navigateur. */
    .sidebar-footer-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    .sidebar-footer-btn:hover {
      background: var(--bg-main);
      color: var(--text-main);
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

    /* Petits/grands téléphones : la barre supérieure garde le titre lisible et les
       actions accessibles sans jamais déborder horizontalement. */
    @media (max-width: 640px) {
      .page-title p {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .page-title h1 {
        font-size: 1.05rem;
      }

      .btn-label {
        display: none;
      }

      .topbar-actions .btn {
        padding: 0.5rem;
      }
    }

    .nav-item.active {
      background: linear-gradient(90deg, #1e40af, #2563eb);
      color: #ffffff;
      font-weight: 600;
    }

    /* Sous-menu "Paramètres Généraux" : un petit panneau flottant à côté du lien plutôt
       qu'un dépliage qui pousserait les liens suivants vers le bas. Affiché au survol sur
       ordinateur (souris). Le tactile n'ayant pas de survol, un bouton chevron dédié
       bascule le même état (paramSubmenuOpen) via toggleParamSubmenu() : il est
       volontairement SÉPARÉ du lien "Paramètres Généraux" lui-même (qui navigue
       normalement, sans interception), car empêcher la navigation d'un routerLink au clic
       s'est révélé peu fiable (RouterLink navigue indépendamment de preventDefault/
       stopPropagation posés sur un gestionnaire (click) séparé sur le même élément).
       Rendu en position:fixed et hors de <aside> (cf. template) : .sidebar-nav a
       overflow-y:auto, qui force aussi le clipping horizontal (overflow-x devient
       implicitement auto), donc un panneau positionné à côté du lien mais resté DANS
       .sidebar-nav serait invisible/inatteignable malgré un opacity:1 correct — la
       position/largeur exactes sont calculées en JS (openParamSubmenu) selon la place
       disponible à l'écran. */
    .nav-item-flyout {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-item-flyout .nav-item {
      flex: 1;
      min-width: 0;
    }

    .submenu-caret-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
    }

    .submenu-caret-btn:hover {
      background: var(--bg-sidebar-hover);
      color: var(--text-main);
    }

    .submenu-caret {
      transition: transform var(--transition-fast);
    }

    .nav-item-flyout.open .submenu-caret {
      transform: rotate(90deg);
    }

    .submenu-flyout {
      position: fixed;
      min-width: 220px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 0.4rem;
      z-index: 45;
    }

    .submenu-item {
      display: block;
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-size: 0.87rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .submenu-item:hover {
      background: var(--bg-sidebar-hover);
      color: var(--text-main);
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
    .icon-slate { color: #64748b; }
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
  // Repliée par défaut sur petit écran (sinon elle recouvre tout le contenu dès le premier
  // chargement, en superposition avec fond assombri) ; ouverte par défaut sur desktop/tablette.
  sidebarOpen = typeof window === 'undefined' || window.innerWidth > 960;
  showPasswordModal = false;
  showProfileModal = false;
  ancienPwd = '';
  nouveauPwd = '';
  pwdError = '';
  pwdSuccess = false;
  profileError = '';
  logoData: string | null = null;
  paramSubmenuOpen = false;
  paramSubmenuTop = 0;
  paramSubmenuLeft = 0;
  paramSubmenuWidth: number | null = null;
  private paramSubmenuCloseTimer: ReturnType<typeof setTimeout> | null = null;

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

  /** Place le sous-menu à droite du lien s'il y a la place, sinon en dessous (petit écran) :
   *  calculé dynamiquement plutôt qu'en CSS pur, car le panneau est rendu hors de <aside>
   *  (cf. commentaire sur .submenu-flyout) et n'a donc plus de position relative naturelle
   *  par rapport au lien survolé. */
  private positionParamSubmenu(rect: DOMRect): void {
    const largeurSousMenu = 220;
    const marge = 8;
    if (rect.right + marge + largeurSousMenu <= window.innerWidth) {
      this.paramSubmenuTop = rect.top;
      this.paramSubmenuLeft = rect.right + marge;
      this.paramSubmenuWidth = null;
    } else {
      this.paramSubmenuTop = rect.bottom + 4;
      this.paramSubmenuLeft = rect.left;
      this.paramSubmenuWidth = rect.width;
    }
  }

  /** Le tactile synthétise parfois mouseenter/mouseleave après un appui (sans survol réel
   *  persistant) : sans ce garde-fou, le sous-menu ouvert par toggleParamSubmenu() se
   *  refermait aussitôt via un mouseleave synthétique. Ces deux méthodes ne font donc rien
   *  sur un appareil sans souris ; seul le bouton chevron y contrôle le sous-menu. */
  private get survolDisponible(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: hover)').matches;
  }

  /** Survol (souris) : ouvre immédiatement, sans attendre un clic. */
  openParamSubmenu(event: MouseEvent): void {
    if (!this.survolDisponible) return;
    this.cancelCloseParamSubmenu();
    this.positionParamSubmenu((event.currentTarget as HTMLElement).getBoundingClientRect());
    this.paramSubmenuOpen = true;
  }

  /** Petit délai avant de refermer, pour laisser le temps au curseur de traverser
   *  l'intervalle entre le lien et le panneau (tous deux annulent ce délai à leur survol
   *  via cancelCloseParamSubmenu, cf. template). */
  scheduleCloseParamSubmenu(): void {
    if (!this.survolDisponible) return;
    this.paramSubmenuCloseTimer = setTimeout(() => { this.paramSubmenuOpen = false; }, 200);
  }

  cancelCloseParamSubmenu(): void {
    if (this.paramSubmenuCloseTimer) {
      clearTimeout(this.paramSubmenuCloseTimer);
      this.paramSubmenuCloseTimer = null;
    }
  }

  /** Bouton chevron dédié (séparé du lien qui navigue) : un appui bascule le sous-menu,
   *  aussi bien tactile que souris. stopPropagation évite que la barre latérale entière se
   *  referme (cf. (click) sur <nav class="sidebar-nav">, pensé pour les liens qui naviguent
   *  réellement) et que le clic atteigne l'écouteur mouseleave du survol. */
  toggleParamSubmenu(event: Event): void {
    event.stopPropagation();
    if (this.paramSubmenuOpen) {
      this.paramSubmenuOpen = false;
      return;
    }
    const wrapper = (event.currentTarget as HTMLElement).closest('.nav-item-flyout') as HTMLElement;
    this.positionParamSubmenu(wrapper.getBoundingClientRect());
    this.paramSubmenuOpen = true;
  }

  closeParamSubmenu(): void {
    this.cancelCloseParamSubmenu();
    this.paramSubmenuOpen = false;
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
