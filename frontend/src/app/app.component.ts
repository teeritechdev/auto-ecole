import { Component, ChangeDetectionStrategy, HostListener, ElementRef, ViewChild } from '@angular/core';

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
          <div class="sidebar-backdrop" (click)="sidebarOpen = false; closeFlyout()"></div>
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
                <img src="/assets/logo-sira.png" alt="SIRA Auto-École" style="width: 100%; height: 100%; object-fit: contain; background: white;" />
              }
            </div>
            <div class="brand-text">
              <h2>{{ brandNom }}</h2>
              @if (brandCategorie) {
                <span>{{ brandCategorie }}</span>
              }
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
            @if (showCandidatsSection) {
              <div class="nav-section-title">Candidats</div>
            }
            @if (hasPermission(['CANDIDATS_VOIR'])) {
              <a routerLink="/candidats" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-violet" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Inscriptions</span>
              </a>
            }
            @if (hasPermission(['EXAMENS_VOIR'])) {
              <a routerLink="/examens" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-amber" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5"/><path d="M2 9v5"/></svg>
                <span>Examens & Épreuves</span>
              </a>
            }
            @if (showFinancesSection) {
              <div class="nav-section-title">Finances</div>
            }
            @if (hasPermission(['PAIEMENTS_VOIR'])) {
              <a routerLink="/paiements" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <span>Paiements & Reçus</span>
              </a>
            }
            @if (hasPermission(['CAISSE_VOIR'])) {
              <div class="nav-item-flyout" [class.open]="openFlyoutMenu === 'caisse'"
                   (mouseenter)="openFlyout('caisse', $event)" (mouseleave)="scheduleCloseFlyout()">
                <div class="nav-item-flyout-row">
                  <a routerLink="/caisse" routerLinkActive="active" class="nav-item">
                    <svg class="nav-icon icon-teal" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
                    <span>Caisse Ménu Dépense</span>
                  </a>
                  <button type="button" class="submenu-caret-btn" (click)="toggleFlyout('caisse', $event)" aria-label="Afficher les catégories de Caisse Ménu Dépense">
                    <svg class="submenu-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
                @if (openFlyoutMenu === 'caisse') {
                  <div class="submenu-inline">
                    <a routerLink="/caisse" [queryParams]="{tab: 'operations'}" class="submenu-item" (click)="closeFlyout()">Opérations</a>
                    <a routerLink="/caisse" [queryParams]="{tab: 'natures'}" class="submenu-item" (click)="closeFlyout()">Natures d'opération</a>
                  </div>
                }
              </div>
            }
            @if (showCodeSection) {
              <div class="nav-section-title">Code de la Route</div>
            }
            @if (hasPermission(['CODE_SUIVI'])) {
              <a routerLink="/code/resultats" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-amber" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5"/><path d="M2 9v5"/></svg>
                <span>Résultats Code</span>
              </a>
            }
            @if (hasPermission(['CODE_CONFIGURATION_GERER'])) {
              <a routerLink="/parametrage-code" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                <span>Configuration Code</span>
              </a>
            }
            @if (hasPermission(['CODE_QUESTIONS_GERER'])) {
              <a routerLink="/code/questions" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
                <span>Quiz Exercice Code</span>
              </a>
            }
            @if (showAdminSection) {
              <div class="nav-section-title">Administration</div>
            }
            @if (hasPermission(['UTILISATEURS_VOIR'])) {
              <a routerLink="/utilisateurs" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-rose" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                <span>Comptes Utilisateurs</span>
              </a>
            }
            @if (hasRole(['ADMIN'])) {
              <div class="nav-item-flyout" [class.open]="openFlyoutMenu === 'parametrage'"
                   (mouseenter)="openFlyout('parametrage', $event)" (mouseleave)="scheduleCloseFlyout()">
                <div class="nav-item-flyout-row">
                  <a routerLink="/parametrage" [class.active]="isParametrageGeneralActive" class="nav-item">
                    <svg class="nav-icon icon-slate" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                    <span>Paramètres Généraux</span>
                  </a>
                  <button type="button" class="submenu-caret-btn" (click)="toggleFlyout('parametrage', $event)" aria-label="Afficher les catégories de Paramètres Généraux">
                    <svg class="submenu-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
                @if (openFlyoutMenu === 'parametrage') {
                  <div class="submenu-inline">
                    <a routerLink="/parametrage" [queryParams]="{tab: 'identite'}" class="submenu-item" (click)="closeFlyout()">Gestion de profil</a>
                    <a routerLink="/parametrage" [queryParams]="{tab: 'categories'}" class="submenu-item" (click)="closeFlyout()">Catégories de Permis</a>
                    <a routerLink="/parametrage" [queryParams]="{tab: 'sites'}" class="submenu-item" (click)="closeFlyout()">Sites de Formation</a>
                  </div>
                }
              </div>
            }
            @if (hasRole(['ADMIN'])) {
              <a routerLink="/parametrage" [queryParams]="{tab: 'permissions'}" [class.active]="isPermissionsActive" class="nav-item">
                <svg class="nav-icon icon-violet" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Permissions</span>
              </a>
            }
            @if (hasPermission(['AUDIT_VOIR'])) {
              <a routerLink="/audit" routerLinkActive="active" class="nav-item">
                <svg class="nav-icon icon-red" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                <span>Journal d'Audit</span>
              </a>
            }
          </nav>
        </aside>
        <!-- MAIN CONTENT WRAPPER -->
        <div class="main-wrapper" [class.sidebar-closed]="!sidebarOpen">
          <!-- TOPBAR -->
          <header class="topbar">
            <div style="display:flex; align-items:center; gap:0.85rem;">
              <button class="sidebar-toggle-btn" (click)="sidebarOpen = !sidebarOpen" [attr.aria-label]="sidebarOpen ? 'Masquer le menu' : 'Afficher le menu'" [attr.aria-expanded]="sidebarOpen">
                <svg class="sidebar-toggle-icon" [class.rotated]="!sidebarOpen" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
              </button>
              @if (!sidebarOpen) {
                <div class="page-title">
                  <h1>{{ nomEtablissement }}</h1>
                  <p>{{ slogan }}</p>
                </div>
              }
            </div>
            <div class="topbar-actions">
              <!-- USER PROFILE DROPDOWN -->
              <div class="user-dropdown-container" #profileDropdown (mouseenter)="openProfileMenu()" (mouseleave)="scheduleCloseProfileMenu()">
                <button type="button" class="user-topbar-btn" (click)="toggleProfileMenu($event)" [attr.aria-expanded]="profileMenuOpen" title="Mon Profil">
                  <div class="user-topbar-avatar">
                    @if (currentUser?.photoProfile) {
                      <img [src]="currentUser?.photoProfile" alt="Photo de profil" />
                    }
                    @if (!currentUser?.photoProfile) {
                      <span>{{ userInitials }}</span>
                    }
                  </div>
                  <div class="user-topbar-info">
                    <span class="user-topbar-name">{{ currentUser?.nom }} {{ currentUser?.prenom }}</span>
                    <span class="user-topbar-role">{{ currentUser?.role }}</span>
                  </div>
                  <svg class="dropdown-chevron" [class.rotated]="profileMenuOpen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                @if (profileMenuOpen) {
                  <div class="user-dropdown-menu" (click)="$event.stopPropagation()">
                    <button type="button" class="dropdown-item" (click)="openProfileModal()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span>Photo de profil</span>
                    </button>
                    <button type="button" class="dropdown-item" (click)="openPasswordModal()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <span>Mot de passe</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item dropdown-item-danger" (click)="logoutUser()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                }
              </div>
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
                    <img [src]="currentUser?.photoProfile" alt="Photo actuelle" />
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
    .sidebar-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
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

    .sidebar-toggle-icon {
      transition: transform var(--transition-fast);
    }

    .sidebar-toggle-icon.rotated {
      transform: rotate(180deg);
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
      background: linear-gradient(135deg, #103778 0%, #1d5cc7 100%);
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 55, 120, 0.25);
      position: relative;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 18%;
      height: 64%;
      width: 4px;
      background: linear-gradient(to bottom, #fbbf24, #d97706);
      border-radius: 0 4px 4px 0;
    }

    /* Sous-menu de liens (Paramètres Généraux, Caisse Ménu Dépense...) : un dépliage EN
       PLACE dans le flux normal de la barre latérale, qui pousse les liens suivants vers le
       bas plutôt que de les recouvrir (un panneau flottant par-dessus le reste du menu
       cachait les boutons en dessous, ce qui n'est pas souhaitable). Affiché au survol sur
       ordinateur (souris). Le tactile n'ayant pas de survol, un bouton chevron dédié bascule
       le même état (openFlyoutMenu) via toggleFlyout() : il est volontairement SÉPARÉ du
       lien lui-même (qui navigue normalement, sans interception), car empêcher la
       navigation d'un routerLink au clic s'est révélé peu fiable (RouterLink navigue
       indépendamment de preventDefault/stopPropagation posés sur un gestionnaire (click)
       séparé sur le même élément). Un seul sous-menu ouvert à la fois (openFlyoutMenu). */
    .nav-item-flyout {
      display: flex;
      flex-direction: column;
    }

    .nav-item-flyout-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-item-flyout-row .nav-item {
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

    .submenu-inline {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
      padding: 0.15rem 0 0.35rem 2.5rem;
    }

    .submenu-item {
      display: block;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-size: 0.85rem;
      font-weight: 600;
      transition: background var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
    }

    /* Effet "carte" au survol : contrairement au simple aplat gris des boutons
       principaux, un sous-onglet se détache légèrement (ombre + décalage) pour
       bien le distinguer visuellement des onglets parents. */
    .submenu-item:hover {
      background: var(--bg-sidebar);
      box-shadow: var(--shadow-md);
      transform: translateX(2px);
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

    .profile-preview {
      overflow: hidden;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #103778, #1d5cc7);
      color: #fff;
      font-weight: 700;
      border: 1.5px solid #fbbf24;
    }

    .brand-icon { overflow: hidden; }
    .brand-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 0.6rem; }
    .profile-preview { width: 7rem; height: 7rem; margin-bottom: 1rem; font-size: 2rem; }
    .profile-preview img { width: 100%; height: 100%; object-fit: cover; }
    .form-help { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem; }

    /* --- TOPBAR USER PROFILE DROPDOWN --- */
    .user-dropdown-container {
      position: relative;
    }

    .user-topbar-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.45);
      padding: 0.3rem 0.9rem 0.3rem 0.3rem;
      border-radius: 9999px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }

    .user-topbar-btn:hover {
      background: rgba(255, 255, 255, 0.4);
      border-color: rgba(255, 255, 255, 0.75);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    }

    .user-topbar-btn:active {
      transform: scale(0.97);
    }

    .user-topbar-btn[aria-expanded="true"] {
      background: rgba(255, 255, 255, 0.45);
      border-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 0 3px rgba(16, 55, 120, 0.15), 0 4px 14px rgba(0, 0, 0, 0.1);
    }

    .user-topbar-btn:focus-visible {
      outline: 2px solid #103778;
      outline-offset: 2px;
    }

    .user-topbar-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #103778, #1d5cc7);
      color: #fff;
      font-weight: 700;
      font-size: 0.85rem;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
      flex-shrink: 0;
    }

    .user-topbar-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-topbar-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      line-height: 1.25;
    }

    .user-topbar-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #103778;
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-topbar-role {
      display: inline-block;
      font-size: 0.62rem;
      font-weight: 800;
      color: #7c2d12;
      background: rgba(255, 255, 255, 0.55);
      padding: 0.05rem 0.4rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-top: 0.2rem;
    }

    .dropdown-chevron {
      color: #103778;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .dropdown-chevron.rotated {
      transform: rotate(180deg);
    }

    /* DROPDOWN MENU */
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 0.6rem);
      right: 0;
      width: 270px;
      max-width: calc(100vw - 2rem);
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 32px -8px rgba(16, 24, 40, 0.22), 0 4px 10px -4px rgba(16, 24, 40, 0.12);
      border: 1px solid var(--border-color);
      padding: 0.6rem;
      z-index: 100;
      transform-origin: top right;
      animation: dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.45rem 0;
    }

    .dropdown-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--text-main);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
      text-align: left;
    }

    .dropdown-item svg {
      color: var(--text-muted);
      transition: color var(--transition-fast);
      flex-shrink: 0;
    }

    .dropdown-item:hover {
      background: var(--bg-main);
      color: var(--primary);
      transform: translateX(2px);
    }

    .dropdown-item:hover svg {
      color: var(--primary);
    }

    .dropdown-item-danger {
      color: var(--danger);
    }

    .dropdown-item-danger svg {
      color: var(--danger);
    }

    .dropdown-item-danger:hover {
      background: #fef2f2;
      color: #b91c1c;
    }

    .dropdown-item-danger:hover svg {
      color: #b91c1c;
    }

    @media (max-width: 640px) {
      .user-topbar-info {
        display: none;
      }
      .user-topbar-btn {
        padding: 0.3rem;
        gap: 0;
        background: rgba(255, 255, 255, 0.3);
      }
      .user-topbar-avatar {
        width: 40px;
        height: 40px;
      }
      .dropdown-chevron {
        display: none;
      }
      .user-dropdown-menu {
        right: -0.5rem;
        width: 260px;
      }
    }

    @media (max-width: 380px) {
      .user-dropdown-menu {
        right: -1.5rem;
      }
    }
  `]
})
export class AppComponent {
  // Repliée par défaut sur petit écran (sinon elle recouvre tout le contenu dès le premier
  // chargement, en superposition avec fond assombri) ; ouverte par défaut sur desktop/tablette.
  sidebarOpen = typeof window === 'undefined' || window.innerWidth > 960;
  showPasswordModal = false;
  showProfileModal = false;
  profileMenuOpen = false;
  ancienPwd = '';
  nouveauPwd = '';
  pwdError = '';
  pwdSuccess = false;
  profileError = '';
  logoData: string | null = null;
  nomEtablissement = 'Nerwaya Auto-École';
  slogan = 'Plateforme Web Centralisée • Gestion Administrative & Financière';

  /** Sous-menu de la barre latérale actuellement ouvert (survol souris ou bouton chevron
   *  tactile) : null = aucun. Un seul à la fois, mécanisme partagé par tous les liens qui
   *  en ont un (Paramètres Généraux, Caisse Ménu Dépense...). */
  openFlyoutMenu: 'parametrage' | 'caisse' | null = null;
  private flyoutCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private profileCloseTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('profileDropdown') profileDropdown?: ElementRef<HTMLElement>;

  constructor(public authService: AuthService, private router: Router, private apiService: ApiService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.apiService.getLogo().subscribe({
          next: response => {
            this.logoData = response.logoData;
            this.nomEtablissement = response.nomEtablissement;
            this.slogan = response.slogan;
          }
        });
      }
    });
  }

  /** Referme le menu déroulant du profil (topbar) au clic en dehors de celui-ci. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileMenuOpen && !this.profileDropdown?.nativeElement.contains(event.target as Node)) {
      this.profileMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.profileMenuOpen = false;
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  /** Survol (souris) : ouvre/referme le menu profil sans avoir à cliquer, comme les
   *  sous-menus de la barre latérale (cf. openFlyout/scheduleCloseFlyout). Le tactile
   *  (sans survol) reste géré par le clic sur le bouton (toggleProfileMenu). */
  openProfileMenu(): void {
    if (!this.survolDisponible) return;
    this.cancelCloseProfileMenu();
    this.profileMenuOpen = true;
  }

  scheduleCloseProfileMenu(): void {
    if (!this.survolDisponible) return;
    this.profileCloseTimer = setTimeout(() => { this.profileMenuOpen = false; }, 200);
  }

  private cancelCloseProfileMenu(): void {
    if (this.profileCloseTimer) {
      clearTimeout(this.profileCloseTimer);
      this.profileCloseTimer = null;
    }
  }

  openProfileModal(): void {
    this.profileMenuOpen = false;
    this.showProfileModal = true;
  }

  openPasswordModal(): void {
    this.profileMenuOpen = false;
    this.showPasswordModal = true;
  }

  logoutUser(): void {
    this.profileMenuOpen = false;
    this.logout();
  }

  /** Premier mot du nom de l'auto-école (ex: "Nerwaya" dans "Nerwaya Auto-École"),
   *  affiché en évidence dans le bloc logo de la barre latérale. */
  get brandNom(): string {
    return this.nomEtablissement.split(' ')[0];
  }

  /** Reste du nom (ex: "Auto-École"), affiché en sous-titre du bloc logo. */
  get brandCategorie(): string {
    return this.nomEtablissement.split(' ').slice(1).join(' ');
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

  hasPermission(permissions: string[]): boolean {
    return this.authService.hasPermission(permissions);
  }

  /** "Paramètres Généraux" et "Permissions" pointent tous deux vers /parametrage (avec un
   *  tab différent en query param) : routerLinkActive seul ne distingue pas les deux liens
   *  sur ce même chemin, d'où ces deux getters basés sur l'URL courante. */
  get isPermissionsActive(): boolean {
    return this.router.url.startsWith('/parametrage') && this.router.url.includes('tab=permissions');
  }

  get isParametrageGeneralActive(): boolean {
    return this.router.url.startsWith('/parametrage') && !this.router.url.includes('tab=permissions');
  }

  /** Visibilité des titres de section : un titre ne s'affiche que si au moins un des
   *  boutons qu'il regroupe est lui-même visible pour l'utilisateur connecté (sinon on
   *  se retrouverait avec un titre de section sans aucun bouton en dessous). */
  get showCandidatsSection(): boolean {
    return this.hasPermission(['CANDIDATS_VOIR']) || this.hasPermission(['EXAMENS_VOIR']);
  }

  get showFinancesSection(): boolean {
    return this.hasPermission(['PAIEMENTS_VOIR']) || this.hasPermission(['CAISSE_VOIR']) || this.hasPermission(['RAPPORTS_CANDIDATS', 'RAPPORTS_CAISSE']);
  }

  get showCodeSection(): boolean {
    return this.hasPermission(['CODE_SUIVI']) || this.hasPermission(['CODE_CONFIGURATION_GERER']) || this.hasPermission(['CODE_QUESTIONS_GERER']);
  }

  get showAdminSection(): boolean {
    return this.hasPermission(['UTILISATEURS_VOIR']) || this.hasPermission(['AUDIT_VOIR']) || this.hasRole(['ADMIN']);
  }

  logout(): void {
    this.authService.logout();
  }

  /** Le tactile synthétise parfois mouseenter/mouseleave après un appui (sans survol réel
   *  persistant) : sans ce garde-fou, le sous-menu ouvert par toggleFlyout() se refermait
   *  aussitôt via un mouseleave synthétique. Ces deux méthodes ne font donc rien sur un
   *  appareil sans souris ; seul le bouton chevron y contrôle le sous-menu. */
  private get survolDisponible(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: hover)').matches;
  }

  /** Survol (souris) : ouvre immédiatement, sans attendre un clic. Un seul sous-menu ouvert
   *  à la fois (menu générique, réutilisé par tous les liens qui en ont un). */
  openFlyout(menu: 'parametrage' | 'caisse', event: MouseEvent): void {
    if (!this.survolDisponible) return;
    this.cancelCloseFlyout();
    this.openFlyoutMenu = menu;
  }

  /** Petit délai avant de refermer, pour laisser le temps au curseur de traverser
   *  l'intervalle entre le lien et le panneau (tous deux annulent ce délai à leur survol
   *  via cancelCloseFlyout, cf. template). */
  scheduleCloseFlyout(): void {
    if (!this.survolDisponible) return;
    this.flyoutCloseTimer = setTimeout(() => { this.openFlyoutMenu = null; }, 200);
  }

  cancelCloseFlyout(): void {
    if (this.flyoutCloseTimer) {
      clearTimeout(this.flyoutCloseTimer);
      this.flyoutCloseTimer = null;
    }
  }

  /** Bouton chevron dédié (séparé du lien qui navigue) : un appui bascule le sous-menu,
   *  aussi bien tactile que souris. stopPropagation évite que la barre latérale entière se
   *  referme (cf. (click) sur <nav class="sidebar-nav">, pensé pour les liens qui naviguent
   *  réellement) et que le clic atteigne l'écouteur mouseleave du survol. */
  toggleFlyout(menu: 'parametrage' | 'caisse', event: Event): void {
    event.stopPropagation();
    this.openFlyoutMenu = this.openFlyoutMenu === menu ? null : menu;
  }

  closeFlyout(): void {
    this.cancelCloseFlyout();
    this.openFlyoutMenu = null;
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
