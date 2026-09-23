import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { UtilisateurDTO, Site, Profil, IdentifiantsCompte } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-utilisateurs',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="utilisateurs-page">
      <div class="page-header-bar">
        <div>
          <h2>Gestion des Utilisateurs & Droits</h2>
        </div>
        <div class="header-buttons">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div class="search-box">
            <input
              type="text"
              class="form-control"
              placeholder="Rechercher par identifiant, nom, prénom, email..."
              [(ngModel)]="rechercheFiltre"
            />
          </div>
          <div>
            <select class="form-control" [(ngModel)]="roleFiltre">
              <option value="">Tous les rôles</option>
              <option value="ADMIN">Administrateur</option>
              <option value="SECRETAIRE">Secrétaire</option>
              <option value="CAISSIERE">Caissière</option>
              <option value="MONITEUR">Moniteur</option>
            </select>
          </div>
          <div>
            <select class="form-control" [(ngModel)]="siteFiltre">
              <option value="">Tous les sites</option>
              @for (s of sites; track s.id) {
                <option [value]="s.id">{{ s.nom }}</option>
              }
            </select>
          </div>
          <div>
            <select class="form-control" [(ngModel)]="statutFiltre">
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="INACTIF">Désactivés</option>
            </select>
          </div>
          <div>
            <button class="btn btn-secondary btn-block" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>
    
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Utilisateur</th>
                <th>Contact</th>
                <th>Profil</th>
                <th>Rôle Attribué</th>
                <th>Site d'affectation</th>
                <th>Statut</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="8" class="text-center py-4">Chargement des utilisateurs...</td>
                </tr>
              }
              @if (!loading && utilisateursFiltres.length === 0) {
                <tr>
                  <td colspan="8" class="text-center py-4">Aucun utilisateur trouvé pour ces critères.</td>
                </tr>
              }
              @for (u of utilisateursFiltres; track u.id) {
                <tr>
                  <td>
                    <div class="user-photo-small">
                      @if (u.photoProfile) {
                        <img [src]="u.photoProfile" alt="Photo utilisateur" />
                      }
                      @if (!u.photoProfile) {
                        <span>{{ getInitials(u) }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <strong>{{ u.nom }} {{ u.prenom }}</strong>
                    <div class="sub-text" style="color: var(--text-muted); font-size: 0.8rem;">{{ u.username }}</div>
                  </td>
                  <td>
                    <div>{{ u.email || '—' }}</div>
                    @if (u.telephone) {
                      <small class="text-muted">{{ u.telephone }}</small>
                    }
                  </td>
                  <td>
                    <span class="badge badge-programme">{{ u.profilNom || '—' }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-expire': u.role === 'ADMIN',
                      'badge-programme': u.role === 'SECRETAIRE',
                      'badge-solde': u.role === 'CAISSIERE',
                      'badge-ajourne': u.role === 'MONITEUR'
                    }">{{ u.roleLibelle }}</span>
                  </td>
                  <td>
                    @if (u.siteNoms && u.siteNoms.length > 0) {
                      <span class="badge badge-secondary">{{ u.siteNoms.join(', ') }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td>
                    <span class="badge" [ngClass]="u.actif ? 'badge-solde' : 'badge-expire'">
                      {{ u.actif ? 'ACTIF' : 'DÉSACTIVÉ' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="table-actions">
                      <button class="btn btn-outline btn-xs" (click)="openEditModal(u)" title="Modifier">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                      </button>
                      <button class="btn btn-outline btn-xs" (click)="resetPassword(u)" title="Réinitialiser le mot de passe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </button>
                      <button class="btn btn-xs" [ngClass]="u.actif ? 'btn-danger' : 'btn-success'" [title]="u.actif ? 'Désactiver le compte' : 'Activer le compte'" (click)="toggleActif(u)">
                        @if (u.actif) {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        } @else {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    
      <!-- MODAL CRÉATION / MODIFICATION -->
      @if (showModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                @if (isEdit) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                }
                {{ isEdit ? 'Modifier l’utilisateur' : 'Créer un compte utilisateur' }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveUtilisateur()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ formError }}
                  </div>
                }
                @if (!isEdit) {
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Identifiant de connexion <span class="required">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="currentUserForm.username" name="username" required placeholder="Ex: amadou" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Mot de passe <span class="required">*</span></label>
                      <div class="password-input-wrapper">
                        <input [type]="showPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="currentUserForm.password" name="password" required placeholder="••••••••" autocomplete="new-password" />
                        <button type="button" class="password-toggle-btn" (click)="showPassword = !showPassword" [title]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" tabindex="-1">
                          @if (!showPassword) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          }
                          @if (showPassword) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                }
                @if (isEdit) {
                  <div class="form-group">
                    <label class="form-label">Identifiant de connexion <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="currentUserForm.username" name="username" required placeholder="Ex: amadou" />
                  </div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Nom <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="currentUserForm.nom" name="nom" required placeholder="Ex: KOUASSI" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Prénom <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="currentUserForm.prenom" name="prenom" required placeholder="Ex: Jean" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" [(ngModel)]="currentUserForm.email" name="email" placeholder="user@autoecole.ci (optionnel)" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Téléphone</label>
                    <input type="tel" class="form-control" [(ngModel)]="currentUserForm.telephone" name="telephone" placeholder="0701020304" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Profil <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="currentUserForm.profilId" name="profilId" (change)="onProfilChange()">
                    @for (p of profils; track p.id) {
                      <option [ngValue]="p.id">{{ p.nom }}{{ p.systeme ? ' (Système)' : '' }}</option>
                    }
                  </select>
                  <div class="form-help">Détermine précisément les fonctionnalités accessibles à ce compte (cf. Paramètres Généraux &gt; Permissions).</div>
                </div>
                <div class="form-group">
                  <label class="form-label">Rôle attribué <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="currentUserForm.role" name="role" required (change)="onRoleChange()">
                    <option value="ADMIN">Administrateur (Tous les droits)</option>
                    <option value="SECRETAIRE">Secrétaire (Gestion inscrits & inscriptions)</option>
                    <option value="CAISSIERE">Caissière (Encaissements, reçus, caisse)</option>
                    <option value="MONITEUR">Moniteur (Suivi pédagogique & examens)</option>
                  </select>
                </div>
                @if (['MONITEUR', 'SECRETAIRE', 'CAISSIERE'].includes(currentUserForm.role)) {
                  <div class="form-group">
                    <label class="form-label">Site d'affectation</label>
                    <select class="form-control" [ngModel]="singleSelectedSiteId" (ngModelChange)="onSingleSiteChange($event)" name="siteAffectation">
                      <option [ngValue]="null">-- Aucun site spécifique (tous les sites) --</option>
                      @for (s of sites; track s.id) {
                        <option [ngValue]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                    <div class="form-help">Sélectionnez le site auquel cet agent est rattaché.</div>
                  </div>
                }
                @if (currentUserForm.role === 'MONITEUR') {
                  <div class="form-group">
                    <label class="form-label">Spécialités</label>
                    <div class="specialites-group">
                      <label class="checkbox-label">
                        <input type="checkbox" [checked]="hasSpecialite('CODE')" (change)="toggleSpecialite('CODE')" /> Code
                      </label>
                      <label class="checkbox-label">
                        <input type="checkbox" [checked]="hasSpecialite('CRENEAU')" (change)="toggleSpecialite('CRENEAU')" /> Créneau
                      </label>
                      <label class="checkbox-label">
                        <input type="checkbox" [checked]="hasSpecialite('CIRCULATION')" (change)="toggleSpecialite('CIRCULATION')" /> Circulation
                      </label>
                    </div>
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Photo de profil</label>
                  <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onPhotoSelected($event)" />
                  <div class="form-help">JPG, PNG ou WebP, maximum 2 Mo.</div>
                </div>
                @if (isEdit) {
                  <div class="form-group">
                    <label class="form-label">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <div class="password-input-wrapper">
                      <input [type]="showEditPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="currentUserForm.password" name="password" placeholder="••••••••" autocomplete="new-password" />
                      <button type="button" class="password-toggle-btn" (click)="showEditPassword = !showEditPassword" [title]="showEditPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" tabindex="-1">
                        @if (!showEditPassword) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        }
                        @if (showEditPassword) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        }
                      </button>
                    </div>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL MOT DE PASSE RÉINITIALISÉ (affichage unique) -->
      @if (identifiantsCompteAAfficher) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Mot de passe réinitialisé
              </h3>
              <button class="btn btn-outline btn-sm" (click)="identifiantsCompteAAfficher = null">✕</button>
            </div>
            <div class="modal-body">
              <p>Un nouveau mot de passe temporaire a été généré pour ce compte. Communiquez-le-lui dès maintenant : il ne sera plus jamais affiché.</p>
              <div class="form-group mt-3">
                <label class="form-label">Identifiant</label>
                <input type="text" class="form-control" [value]="identifiantsCompteAAfficher.username" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Mot de passe temporaire</label>
                <input type="text" class="form-control" [value]="identifiantsCompteAAfficher.motDePasseTemporaire" readonly />
              </div>
              <p class="form-help">L'utilisateur devra changer ce mot de passe à sa prochaine connexion.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" (click)="identifiantsCompteAAfficher = null">J'ai noté les identifiants</button>
            </div>
          </div>
        </div>
      }
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .page-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .table-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .text-right { text-align: right; }

    .user-photo-small {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      font-weight: 700;
    }

    .user-photo-small img { width: 100%; height: 100%; object-fit: cover; }
    .form-help { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem; }
    .specialites-group { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .checkbox-label { display: flex; align-items: center; gap: 0.4rem; font-weight: 500; }
    .filter-card { margin-bottom: 1.5rem; padding: 1.25rem; }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }
  `]
})
export class UtilisateursComponent implements OnInit {
  utilisateurs: UtilisateurDTO[] = [];
  sites: Site[] = [];
  profils: Profil[] = [];
  loading = false;
  saving = false;

  // Filtres
  rechercheFiltre = '';
  roleFiltre = '';
  siteFiltre: string | number = '';
  statutFiltre = '';

  showModal = false;
  isEdit = false;
  showPassword = false;
  showEditPassword = false;
  selectedId: number | null = null;
  formError = '';
  pendingPhoto: string | null = null;
  identifiantsCompteAAfficher: IdentifiantsCompte | null = null;

  currentUserForm: any = {
    username: '',
    password: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'SECRETAIRE',
    profilId: null,
    siteIds: [],
    specialites: []
  };

  get singleSelectedSiteId(): number | null {
    return this.currentUserForm.siteIds && this.currentUserForm.siteIds.length > 0
      ? this.currentUserForm.siteIds[0]
      : null;
  }

  onSingleSiteChange(siteId: number | null): void {
    this.currentUserForm.siteIds = siteId != null ? [siteId] : [];
  }

  get utilisateursFiltres(): UtilisateurDTO[] {
    return this.utilisateurs.filter(u => {
      if (this.rechercheFiltre) {
        const q = this.rechercheFiltre.trim().toLowerCase();
        const matchUsername = u.username?.toLowerCase().includes(q);
        const matchNom = u.nom?.toLowerCase().includes(q);
        const matchPrenom = u.prenom?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchTel = u.telephone?.toLowerCase().includes(q);
        if (!matchUsername && !matchNom && !matchPrenom && !matchEmail && !matchTel) return false;
      }
      if (this.roleFiltre && u.role !== this.roleFiltre) return false;
      if (this.siteFiltre) {
        const sId = Number(this.siteFiltre);
        if (!u.siteIds || !u.siteIds.includes(sId)) return false;
      }
      if (this.statutFiltre) {
        if (this.statutFiltre === 'ACTIF' && !u.actif) return false;
        if (this.statutFiltre === 'INACTIF' && u.actif) return false;
      }
      return true;
    });
  }

  resetFiltres(): void {
    this.rechercheFiltre = '';
    this.roleFiltre = '';
    this.siteFiltre = '';
    this.statutFiltre = '';
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.apiService.getSites(true).subscribe({ next: (res) => this.sites = res });
    this.apiService.getProfils().subscribe({ next: (res) => this.profils = res });
  }

  /** Présélectionne le profil système du rôle choisi */
  onRoleChange(): void {
    const profilSysteme = this.profils.find(p => p.roleSysteme === this.currentUserForm.role);
    if (profilSysteme) {
      this.currentUserForm.profilId = profilSysteme.id;
    }
  }

  /** Met à jour le rôle si le profil sélectionné est un profil système spécifique */
  onProfilChange(): void {
    const profil = this.profils.find(p => p.id === this.currentUserForm.profilId);
    if (profil && profil.roleSysteme) {
      this.currentUserForm.role = profil.roleSysteme;
    }
  }

  hasSpecialite(type: string): boolean {
    return !!this.currentUserForm.specialites?.includes(type);
  }

  toggleSpecialite(type: string): void {
    if (!this.currentUserForm.specialites) this.currentUserForm.specialites = [];
    const idx = this.currentUserForm.specialites.indexOf(type);
    if (idx >= 0) {
      this.currentUserForm.specialites.splice(idx, 1);
    } else {
      this.currentUserForm.specialites.push(type);
    }
  }

  hasSite(id: number): boolean {
    return !!this.currentUserForm.siteIds?.includes(id);
  }

  toggleSite(id: number): void {
    if (!this.currentUserForm.siteIds) this.currentUserForm.siteIds = [];
    const idx = this.currentUserForm.siteIds.indexOf(id);
    if (idx >= 0) {
      this.currentUserForm.siteIds.splice(idx, 1);
    } else {
      this.currentUserForm.siteIds.push(id);
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.apiService.getUtilisateurs().subscribe({
      next: (res) => {
        this.utilisateurs = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEdit = false;
    this.showPassword = false;
    this.selectedId = null;
    this.formError = '';
    this.currentUserForm = {
      username: '',
      password: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      role: 'SECRETAIRE',
      profilId: null,
      siteIds: [],
      specialites: [],
      photoProfile: null
    };
    this.onRoleChange();
    this.showModal = true;
  }

  openEditModal(u: UtilisateurDTO): void {
    this.isEdit = true;
    this.showEditPassword = false;
    this.selectedId = u.id;
    this.formError = '';
    this.currentUserForm = {
      username: u.username,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      role: u.role,
      profilId: u.profilId ?? null,
      password: '',
      siteIds: u.siteIds ? [...u.siteIds] : [],
      specialites: u.specialites ? [...u.specialites] : [],
      photoProfile: u.photoProfile || null
    };
    this.showModal = true;
  }

  saveUtilisateur(): void {
    this.saving = true;
    this.formError = '';

    if (this.isEdit && this.selectedId) {
      this.apiService.updateUtilisateur(this.selectedId, this.currentUserForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.formError = extraireMessageErreur(err, 'Erreur lors de la mise à jour.');
        }
      });
    } else {
      this.apiService.createUtilisateur(this.currentUserForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.formError = extraireMessageErreur(err, 'Erreur lors de la création.');
        }
      });
    }
  }

  getInitials(user: UtilisateurDTO): string {
    return `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() || 'U';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.formError = 'La photo ne doit pas dépasser 2 Mo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.currentUserForm.photoProfile = reader.result as string;
    reader.readAsDataURL(file);
  }

  toggleActif(u: UtilisateurDTO): void {
    this.apiService.toggleActifUtilisateur(u.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors du changement de statut.'))
    });
  }

  resetPassword(u: UtilisateurDTO): void {
    if (!confirm(`Réinitialiser le mot de passe de ${u.nom} ${u.prenom} ? Son ancien mot de passe cessera immédiatement de fonctionner.`)) {
      return;
    }
    this.apiService.resetPasswordUtilisateur(u.id).subscribe({
      next: (identifiants) => this.identifiantsCompteAAfficher = identifiants,
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors de la réinitialisation du mot de passe.'))
    });
  }
}
