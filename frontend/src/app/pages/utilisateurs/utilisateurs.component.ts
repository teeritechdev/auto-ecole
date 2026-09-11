import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { UtilisateurDTO, Site } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-utilisateurs',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="utilisateurs-page">
      <div class="page-header-bar">
        <div>
          <h2>Gestion des Utilisateurs & Droits</h2>
          <p>Administration des comptes (Administrateur, Secrétaire, Caissière, Moniteur)</p>
        </div>
        <div class="header-buttons">
          <button class="btn btn-primary" (click)="openCreateModal()">
            ➕ Nouvel Utilisateur
          </button>
        </div>
      </div>
    
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Identifiant</th>
                <th>Nom & Prénom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle Attribué</th>
                <th>Statut</th>
                <th>Date Création</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center py-4">Chargement des utilisateurs...</td>
                </tr>
              }
              @for (u of utilisateurs; track u) {
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
                  <td><strong>{{ u.username }}</strong></td>
                  <td>{{ u.nom }} {{ u.prenom }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.telephone || '—' }}</td>
                  <td>
                  <span class="badge" [ngClass]="{
                    'badge-expire': u.role === 'ADMIN',
                    'badge-programme': u.role === 'SECRETAIRE',
                    'badge-solde': u.role === 'CAISSIERE',
                    'badge-ajourne': u.role === 'MONITEUR'
                  }">{{ u.roleLibelle }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="u.actif ? 'badge-solde' : 'badge-expire'">
                      {{ u.actif ? 'ACTIF' : 'DÉSACTIVÉ' }}
                    </span>
                  </td>
                  <td>{{ u.dateCreation | date:'dd/MM/yyyy' }}</td>
                  <td class="text-right">
                    <div class="table-actions">
                      <button class="btn btn-outline btn-sm" (click)="openEditModal(u)" title="Modifier">✏️</button>
                      <button class="btn btn-sm" [ngClass]="u.actif ? 'btn-danger' : 'btn-success'" (click)="toggleActif(u)">
                        {{ u.actif ? 'Désactiver' : 'Activer' }}
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
              <h3>{{ isEdit ? '✏️ Modifier l’utilisateur' : '👤 Créer un compte utilisateur' }}</h3>
              <button class="btn btn-outline btn-sm" (click)="showModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveUtilisateur()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">⚠️ {{ formError }}</div>
                }
                @if (!isEdit) {
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Identifiant de connexion <span class="required">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="currentUserForm.username" name="username" required placeholder="Ex: amadou" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Mot de passe <span class="required">*</span></label>
                      <input type="password" class="form-control" [(ngModel)]="currentUserForm.password" name="password" required placeholder="••••••••" />
                    </div>
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
                    <label class="form-label">Email <span class="required">*</span></label>
                    <input type="email" class="form-control" [(ngModel)]="currentUserForm.email" name="email" required placeholder="user@autoecole.ci" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Téléphone</label>
                    <input type="tel" class="form-control" [(ngModel)]="currentUserForm.telephone" name="telephone" placeholder="0701020304" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Rôle attribué <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="currentUserForm.role" name="role" required>
                    <option value="ADMIN">Administrateur (Tous les droits)</option>
                    <option value="SECRETAIRE">Secrétaire (Gestion candidats & inscriptions)</option>
                    <option value="CAISSIERE">Caissière (Encaissements, reçus, caisse)</option>
                    <option value="MONITEUR">Moniteur (Suivi pédagogique & examens)</option>
                  </select>
                </div>
                @if (currentUserForm.role === 'MONITEUR') {
                  <div class="form-group">
                    <label class="form-label">Site de formation <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="currentUserForm.siteId" name="siteId" required>
                      <option [ngValue]="null" disabled>Sélectionner un site</option>
                      @for (s of sites; track s) {
                        <option [ngValue]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                    <div class="form-help">Le moniteur ne pourra voir et gérer que les candidats inscrits sur ce site.</div>
                  </div>
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
                    <input type="password" class="form-control" [(ngModel)]="currentUserForm.password" name="password" placeholder="••••••••" />
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
  `]
})
export class UtilisateursComponent implements OnInit {
  utilisateurs: UtilisateurDTO[] = [];
  sites: Site[] = [];
  loading = false;
  saving = false;

  showModal = false;
  isEdit = false;
  selectedId: number | null = null;
  formError = '';
  pendingPhoto: string | null = null;

  currentUserForm: any = {
    username: '',
    password: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'SECRETAIRE',
    siteId: null,
    specialites: []
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.apiService.getSites(true).subscribe({ next: (res) => this.sites = res });
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
      siteId: null,
      specialites: [],
      photoProfile: null
    };
    this.showModal = true;
  }

  openEditModal(u: UtilisateurDTO): void {
    this.isEdit = true;
    this.selectedId = u.id;
    this.formError = '';
    this.currentUserForm = {
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      role: u.role,
      password: '',
      siteId: u.siteId || null,
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
}
