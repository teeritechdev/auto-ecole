import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CategoriePermis, Identite, Site, SiteStat, Profil, PermissionCatalogue } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

type OngletParametrage = 'identite' | 'categories' | 'tarifs' | 'sites' | 'stats' | 'permissions';
const ONGLETS_VALIDES: OngletParametrage[] = ['identite', 'categories', 'tarifs', 'sites', 'stats', 'permissions'];

@Component({
    selector: 'app-parametrage',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="parametrage-page">
      <div class="page-header-bar">
        <div>
          <h2>Paramètres Généraux</h2>
          <p>{{ sousTitrePourOnglet() }}</p>
        </div>
      </div>

      <!-- Navigation entre sections : via le sous-menu au survol de "Paramètres Généraux"
           dans la barre latérale (plus de barre d'onglets redondante ici). -->

      <!-- ===================== ONGLET IDENTITÉ ===================== -->
      @if (activeTab === 'identite') {
        <div class="card identite-card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Identité de l'auto-école
            </div>
          </div>
          <form (ngSubmit)="saveIdentite()">
            @if (identiteError) {
              <div class="alert alert-danger">{{ identiteError }}</div>
            }
            @if (identiteSuccess) {
              <div class="alert alert-success">Identité enregistrée.</div>
            }
            <div class="identite-layout">
              <div class="images-column">
                <div class="logo-settings">
                  <div class="logo-preview">
                    @if (identiteForm.logoData) {
                      <img [src]="identiteForm.logoData" alt="Logo actuel" />
                    } @else {
                      <span>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L19 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
                      </span>
                    }
                  </div>
                  <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onLogoSelected($event)" />
                  <p class="form-help">Affiché sur toutes les pages et l'écran de connexion. JPG, PNG ou WebP, maximum 2 Mo.</p>
                </div>
                <div class="connexion-settings">
                  <div class="connexion-preview">
                    @if (identiteForm.imageConnexion) {
                      <img [src]="identiteForm.imageConnexion" alt="Image de connexion actuelle" />
                    } @else {
                      <span>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </span>
                    }
                  </div>
                  <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onImageConnexionSelected($event)" />
                  <p class="form-help">Photo affichée à côté du formulaire de connexion. JPG, PNG ou WebP, maximum 3 Mo — compressez-la avant l'envoi pour un chargement rapide de l'écran de connexion.</p>
                  @if (identiteForm.imageConnexion) {
                    <div class="form-group" style="width: 100%; margin-top: 0.5rem;">
                      <label class="form-label">Ajustement de l'image</label>
                      <select class="form-control" [(ngModel)]="identiteForm.imageConnexionAjustement" name="imageConnexionAjustement">
                        <option value="cover">Remplir l'écran (peut recadrer l'image)</option>
                        <option value="contain">Toujours voir l'image entière (sans recadrage)</option>
                      </select>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" (click)="retirerImageConnexion()">Retirer l'image</button>
                  }
                </div>
              </div>
              <div class="identite-fields">
                <div class="form-group">
                  <label class="form-label">Nom de l'auto-école <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="identiteForm.nomEtablissement" name="nomEtablissement" required placeholder="Ex: Nerwaya Auto-École" />
                  <p class="form-help">Affiché sur l'écran de connexion et les documents officiels (reçus, PDF).</p>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Téléphone</label>
                    <input type="tel" class="form-control" [(ngModel)]="identiteForm.telephone" name="telephone" placeholder="Ex: 0701020304" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" [(ngModel)]="identiteForm.email" name="email" placeholder="Ex: contact@autoecole.ci" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Adresse du siège</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="identiteForm.adresseSiege" name="adresseSiege" placeholder="Ex: Boulevard de France, Cocody, Abidjan"></textarea>
                  <p class="form-help">Coordonnées du siège de l'entreprise, distinctes de l'adresse de chaque site de formation.</p>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingIdentite">
              {{ savingIdentite ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </form>
        </div>
      }

      <!-- ===================== ONGLET CATÉGORIES DE PERMIS ===================== -->
      @if (activeTab === 'categories') {
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L19 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
              Catégories de Permis (A1, B, C...)
            </div>
            <button class="btn btn-primary btn-sm" (click)="openCatModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Nouvelle Catégorie
            </button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé Officiel</th>
                  <th>Montant</th>
                  <th>Description</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categories; track cat) {
                  <tr>
                    <td><span class="badge badge-programme">{{ cat.code }}</span></td>
                    <td><strong>{{ cat.libelle }}</strong></td>
                    <td><strong class="text-success">{{ cat.montant | number }} FCFA</strong></td>
                    <td><small class="text-muted">{{ cat.description || '—' }}</small></td>
                    <td class="text-right">
                      <button class="btn btn-outline btn-sm" (click)="editCat(cat)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ===================== ONGLET TARIFS DES EXAMENS ===================== -->
      @if (activeTab === 'tarifs') {
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
              Tarifs des examens
            </div>
          </div>
          <form (ngSubmit)="saveTarifsExamens()">
            <div class="tarifs-examens-form">
              <div class="form-group">
                <label class="form-label">Prix examen Code (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="tarifsForm.prixExamenCode" name="prixExamenCode" min="0" required />
              </div>
              <div class="form-group">
                <label class="form-label">Prix examen Créneau (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="tarifsForm.prixExamenCreneau" name="prixExamenCreneau" min="0" required />
              </div>
              <div class="form-group">
                <label class="form-label">Prix examen Circulation (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="tarifsForm.prixExamenCirculation" name="prixExamenCirculation" min="0" required />
              </div>
            </div>
            <p class="form-help">Utilisés par Caisse Ménu Dépense pour calculer automatiquement le montant à décaisser lors d'une prise en charge des frais d'examen.</p>
            @if (tarifsError) {
              <div class="alert alert-danger">{{ tarifsError }}</div>
            }
            @if (tarifsSuccess) {
              <div class="alert alert-success">Tarifs enregistrés.</div>
            }
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingTarifs">
              {{ savingTarifs ? 'Enregistrement...' : 'Enregistrer les tarifs' }}
            </button>
          </form>
        </div>
      }

      <!-- ===================== ONGLET SITES DE FORMATION ===================== -->
      @if (activeTab === 'sites') {
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="9" y1="12" x2="9" y2="12.01"/><line x1="9" y1="15" x2="9" y2="15.01"/><line x1="9" y1="18" x2="9" y2="18.01"/></svg>
              Sites de Formation
            </div>
            <button class="btn btn-primary btn-sm" (click)="openSiteModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Nouveau Site
            </button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Nom du Site</th>
                  <th>Adresse</th>
                  <th>Statut</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (s of sites; track s) {
                  <tr>
                    <td><strong>{{ s.nom }}</strong></td>
                    <td><small class="text-muted">{{ s.adresse || '—' }}</small></td>
                    <td>
                      @if (s.actif) {
                        <span class="badge badge-solde">Actif</span>
                      } @else {
                        <span class="badge badge-expire">Inactif</span>
                      }
                    </td>
                    <td class="text-right">
                      <button class="btn btn-outline btn-sm" (click)="editSite(s)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ===================== ONGLET STATISTIQUES PAR SITE ===================== -->
      @if (activeTab === 'stats') {
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Statistiques par Site
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th class="text-right">Personnel Affecté</th>
                  <th class="text-right">Candidats Actifs</th>
                  <th class="text-right">Inscriptions Créées</th>
                  <th class="text-right">Paiements Encaissés</th>
                  <th class="text-right">Montant Encaissé</th>
                  <th class="text-right">Solde Restant Dû</th>
                  <th class="text-right">Solde Caisse</th>
                </tr>
              </thead>
              <tbody>
                @if (statsSites.length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-4 text-muted">Aucune donnée pour l'instant.</td>
                  </tr>
                }
                @for (stat of statsSites; track stat) {
                  <tr>
                    <td><strong>{{ stat.siteNom }}</strong></td>
                    <td class="text-right">{{ stat.nombrePersonnel }}</td>
                    <td class="text-right">{{ stat.nombreCandidatsActifs }}</td>
                    <td class="text-right">{{ stat.nombreInscriptions }}</td>
                    <td class="text-right">{{ stat.nombrePaiements }} <small class="text-muted">({{ stat.montantPaiements | number }} FCFA)</small></td>
                    <td class="text-right text-success">{{ stat.montantEncaisse | number }} FCFA</td>
                    <td class="text-right">{{ stat.montantRestantDu | number }} FCFA</td>
                    <td class="text-right" [ngClass]="stat.soldeCaisse >= 0 ? 'text-success' : 'text-danger'">{{ stat.soldeCaisse | number }} FCFA</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ===================== ONGLET PERMISSIONS ===================== -->
      @if (activeTab === 'permissions') {
        <div class="permissions-layout">
          <div class="card profils-list-card">
            <div class="card-header">
              <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 7.3 12 12l-8.5-4.7"/><path d="M12 22V12"/><path d="m20.5 16.7-8.5 4.7-8.5-4.7"/><path d="m3.5 7.3 8.5-4.7 8.5 4.7-8.5 4.7-8.5-4.7Z"/></svg>
                Profils
              </div>
              <button class="btn btn-primary btn-sm" (click)="openCreateProfilModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Nouveau Profil
              </button>
            </div>
            <ul class="profils-list">
              @for (p of profils; track p.id) {
                <li [class.active]="selectedProfil?.id === p.id" (click)="selectProfil(p)">
                  <div class="profil-item-main">
                    <strong>{{ p.nom }}</strong>
                    @if (p.systeme) { <span class="badge badge-programme">Système</span> }
                  </div>
                  <small class="text-muted">{{ p.nombreUtilisateurs }} compte(s)</small>
                </li>
              }
            </ul>
          </div>

          <div class="card profil-detail-card">
            @if (!selectedProfil) {
              <div class="empty-state-inline">Sélectionnez un profil à gauche pour voir ou modifier ses permissions.</div>
            }
            @if (selectedProfil) {
              <div class="card-header">
                <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {{ selectedProfil.nom }}
                </div>
                @if (!selectedProfil.systeme) {
                  <button class="btn btn-outline btn-sm" [disabled]="selectedProfil.nombreUtilisateurs > 0" [title]="selectedProfil.nombreUtilisateurs > 0 ? 'Réaffectez d\\'abord les comptes utilisant ce profil' : 'Supprimer ce profil'" (click)="deleteProfil()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer
                  </button>
                }
              </div>

              @if (selectedProfil.verrouille) {
                <div class="alert alert-info">
                  Le profil Administrateur garde toujours l'intégralité des permissions et ne peut pas être restreint, pour ne jamais bloquer un administrateur.
                </div>
              }

              @if (!selectedProfil.verrouille) {
                <div class="form-row" style="margin-bottom:1rem;">
                  <div class="form-group">
                    <label class="form-label">Nom du profil</label>
                    <input type="text" class="form-control" [(ngModel)]="profilForm.nom" name="profilNom" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-control" [(ngModel)]="profilForm.description" name="profilDescription" />
                  </div>
                </div>
              }

              @if (profilError) {
                <div class="alert alert-danger">{{ profilError }}</div>
              }
              @if (profilSuccess) {
                <div class="alert alert-success">Profil enregistré.</div>
              }

              <div class="permissions-matrix">
                @for (module of modulesPermissions; track module.nom) {
                  <div class="permission-module">
                    <div class="permission-module-title">{{ module.nom }}</div>
                    <div class="permission-module-items">
                      @for (perm of module.items; track perm.code) {
                        <label class="permission-check">
                          <input type="checkbox"
                                 [checked]="workingPermissionCodes.has(perm.code)"
                                 [disabled]="selectedProfil.verrouille"
                                 (change)="togglePermission(perm.code)" />
                          {{ perm.libelle }}
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (!selectedProfil.verrouille) {
                <button class="btn btn-primary btn-sm" style="margin-top:1rem;" [disabled]="savingProfil" (click)="saveProfil()">
                  {{ savingProfil ? 'Enregistrement...' : 'Enregistrer les permissions' }}
                </button>
              }
            }
          </div>
        </div>
      }

      <!-- MODAL NOUVEAU PROFIL -->
      @if (showCreateProfilModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Nouveau Profil de Permissions</h3>
              <button class="btn btn-outline btn-sm" (click)="showCreateProfilModal = false">✕</button>
            </div>
            <form (ngSubmit)="createProfil()">
              <div class="modal-body">
                @if (createProfilError) {
                  <div class="alert alert-danger">{{ createProfilError }}</div>
                }
                <div class="form-group">
                  <label class="form-label">Nom du profil <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="newProfilForm.nom" name="newProfilNom" required placeholder="Ex: Superviseur régional" />
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="newProfilForm.description" name="newProfilDescription" placeholder="Rôle et responsabilités de ce profil"></textarea>
                </div>
                <p class="form-help">Les permissions se cochent ensuite, une fois le profil créé.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCreateProfilModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL CATEGORIE -->
      @if (showCatModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                @if (isEditCat) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                }
                {{ isEditCat ? 'Modifier la Catégorie' : 'Nouvelle Catégorie de Permis' }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showCatModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveCat()">
              <div class="modal-body">
                @if (catError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ catError }}
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Code Catégorie <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="catForm.code" name="code" required placeholder="Ex: D" [disabled]="isEditCat" />
                </div>
                <div class="form-group">
                  <label class="form-label">Libellé <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="catForm.libelle" name="libelle" required placeholder="Ex: Permis D Transport en commun" />
                </div>
                <div class="form-group">
                  <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="catForm.montant" name="montant" required placeholder="Ex: 100000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="catForm.description" name="description"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCatModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL SITE -->
      @if (showSiteModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                @if (isEditSite) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                }
                {{ isEditSite ? 'Modifier le Site' : 'Nouveau Site de Formation' }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showSiteModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveSite()">
              <div class="modal-body">
                @if (siteError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ siteError }}
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Nom du site <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="siteForm.nom" name="nom" required placeholder="Ex: Site Marcory" />
                </div>
                <div class="form-group">
                  <label class="form-label">Adresse</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="siteForm.adresse" name="adresse" placeholder="Ex: Rue du Commerce, Marcory, Abidjan"></textarea>
                </div>
                @if (isEditSite) {
                  <div class="form-group form-check">
                    <label class="form-label">
                      <input type="checkbox" [(ngModel)]="siteForm.actif" name="actif" /> Site actif
                    </label>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showSiteModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
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
      margin-bottom: 1.5rem;
    }

    .text-right { text-align: right; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }

    .identite-layout {
      display: grid;
      grid-template-columns: minmax(160px, 220px) 1fr;
      gap: 2rem;
      margin-bottom: 1.25rem;
    }

    .identite-fields {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      min-width: 0;
    }

    /* Sur petit téléphone, le logo passe au-dessus des champs plutôt que de forcer deux
       colonnes trop étroites pour être utilisables. */
    @media (max-width: 560px) {
      .identite-layout {
        grid-template-columns: 1fr;
      }
    }

    .images-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 0;
      width: 100%;
    }

    .logo-settings, .connexion-settings {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      /* Un input file natif refuse de rétrécir sous sa largeur intrinsèque : sans ça, il
         déborde de cette colonne étroite et chevauche la colonne des champs à côté. */
      min-width: 0;
      width: 100%;
    }
    .logo-settings input[type="file"], .connexion-settings input[type="file"] { max-width: 100%; }
    .logo-preview { width: 7rem; height: 7rem; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0.75rem; background: #eff6ff; color: #2563eb; font-size: 2.5rem; }
    .logo-preview img { width: 100%; height: 100%; object-fit: contain; }
    .connexion-preview { width: 100%; max-width: 12rem; aspect-ratio: 3 / 4; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0.75rem; background: #eff6ff; color: #2563eb; }
    .connexion-preview img { width: 100%; height: 100%; object-fit: cover; }
    .form-help { color: var(--text-muted); font-size: 0.8rem; margin: 0; }
    .tarifs-examens-form { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 0.75rem; }

    .permissions-layout {
      display: grid;
      grid-template-columns: minmax(200px, 280px) 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 720px) {
      .permissions-layout { grid-template-columns: 1fr; }
    }
    .profils-list { list-style: none; margin: 0; padding: 0; }
    .profils-list li {
      display: flex; flex-direction: column; gap: 0.15rem;
      padding: 0.65rem 0.9rem; border-radius: var(--radius-sm, 6px); cursor: pointer;
      border: 1px solid transparent;
    }
    .profils-list li:hover { background: var(--bg-sidebar-hover, #f1f5f9); }
    .profils-list li.active { background: #eff6ff; border-color: #bfdbfe; }
    .profil-item-main { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .empty-state-inline { padding: 2rem 1rem; text-align: center; color: var(--text-muted); }
    .permissions-matrix { display: flex; flex-direction: column; gap: 1rem; }
    .permission-module-title { font-weight: 600; margin-bottom: 0.4rem; color: var(--text-main); }
    .permission-module-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem 1rem; }
    .permission-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 400; cursor: pointer; }
  `]
})
export class ParametrageComponent implements OnInit {
  activeTab: OngletParametrage = 'identite';

  categories: CategoriePermis[] = [];
  sites: Site[] = [];
  statsSites: SiteStat[] = [];

  showCatModal = false;
  isEditCat = false;
  selectedCatId: number | null = null;
  catForm: any = { code: '', libelle: '', montant: null, description: '', actif: true };
  catError = '';

  showSiteModal = false;
  isEditSite = false;
  selectedSiteId: number | null = null;
  siteForm: any = { nom: '', adresse: '', actif: true };
  siteError = '';

  identiteForm: Identite = { logoData: null, imageConnexion: null, imageConnexionAjustement: 'cover', nomEtablissement: '', telephone: '', email: '', adresseSiege: '' };
  identiteError = '';
  identiteSuccess = false;
  savingIdentite = false;

  tarifsForm: any = { prixExamenCode: 0, prixExamenCreneau: 0, prixExamenCirculation: 0 };
  tarifsError = '';
  tarifsSuccess = false;
  savingTarifs = false;

  profils: Profil[] = [];
  permissionsCatalogue: PermissionCatalogue[] = [];
  selectedProfil: Profil | null = null;
  workingPermissionCodes: Set<string> = new Set();
  profilForm: { nom: string; description: string } = { nom: '', description: '' };
  profilError = '';
  profilSuccess = false;
  savingProfil = false;

  showCreateProfilModal = false;
  newProfilForm: { nom: string; description: string } = { nom: '', description: '' };
  createProfilError = '';

  get modulesPermissions(): { nom: string; items: PermissionCatalogue[] }[] {
    const parModule = new Map<string, PermissionCatalogue[]>();
    for (const p of this.permissionsCatalogue) {
      if (!parModule.has(p.module)) parModule.set(p.module, []);
      parModule.get(p.module)!.push(p);
    }
    return Array.from(parModule.entries()).map(([nom, items]) => ({ nom, items }));
  }

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadData();
    // Ouvre directement le bon onglet quand on arrive depuis le sous-menu de la barre
    // latérale (?tab=...) ; s'abonne (plutôt qu'un simple snapshot) car Angular réutilise
    // cette même instance de composant en changeant seulement les query params.
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (ONGLETS_VALIDES.includes(tab)) {
        this.activeTab = tab;
      }
    });
  }

  /** Remplace la barre d'onglets (retirée, redondante avec le sous-menu de la barre
   *  latérale) : précise quand même quelle section est affichée. */
  sousTitrePourOnglet(): string {
    switch (this.activeTab) {
      case 'identite': return "Logo, nom et coordonnées de l'auto-école";
      case 'categories': return 'Catégories de permis proposées et leur tarif';
      case 'tarifs': return 'Tarifs unitaires des épreuves d\'examen';
      case 'sites': return 'Sites de formation de l\'auto-école';
      case 'stats': return 'Activité et finances de chaque site';
      case 'permissions': return "Permissions accordées à chaque profil d'utilisateur";
    }
  }

  loadData(): void {
    this.apiService.getCategories().subscribe({ next: (res) => this.categories = res });
    this.apiService.getSites().subscribe({ next: (res) => this.sites = res });
    this.apiService.getStatistiquesSites().subscribe({ next: (res) => this.statsSites = res });
    this.apiService.getIdentite().subscribe({ next: (res) => this.identiteForm = { ...res } });
    this.apiService.getTarifsExamens().subscribe({ next: (res) => this.tarifsForm = { ...res } });
    this.apiService.getPermissionsCatalogue().subscribe({ next: (res) => this.permissionsCatalogue = res });
    this.loadProfils();
  }

  loadProfils(): void {
    this.apiService.getProfils().subscribe({
      next: (res) => {
        this.profils = res;
        if (this.selectedProfil) {
          const rafraichi = res.find(p => p.id === this.selectedProfil!.id) || null;
          this.selectedProfil = rafraichi;
          if (rafraichi) {
            this.workingPermissionCodes = new Set(rafraichi.permissionCodes);
            this.profilForm = { nom: rafraichi.nom, description: rafraichi.description || '' };
          }
        }
      }
    });
  }

  selectProfil(p: Profil): void {
    this.selectedProfil = p;
    this.workingPermissionCodes = new Set(p.permissionCodes);
    this.profilForm = { nom: p.nom, description: p.description || '' };
    this.profilError = '';
    this.profilSuccess = false;
  }

  togglePermission(code: string): void {
    if (this.workingPermissionCodes.has(code)) {
      this.workingPermissionCodes.delete(code);
    } else {
      this.workingPermissionCodes.add(code);
    }
  }

  saveProfil(): void {
    if (!this.selectedProfil) return;
    this.profilError = '';
    this.profilSuccess = false;
    this.savingProfil = true;
    const payload = {
      nom: this.profilForm.nom,
      description: this.profilForm.description,
      permissionCodes: Array.from(this.workingPermissionCodes)
    };
    this.apiService.updateProfil(this.selectedProfil.id, payload).subscribe({
      next: () => {
        this.savingProfil = false;
        this.profilSuccess = true;
        this.loadProfils();
      },
      error: (err) => {
        this.savingProfil = false;
        this.profilError = extraireMessageErreur(err, "Erreur lors de l'enregistrement du profil.");
      }
    });
  }

  deleteProfil(): void {
    if (!this.selectedProfil || this.selectedProfil.nombreUtilisateurs > 0) return;
    if (!confirm(`Supprimer définitivement le profil "${this.selectedProfil.nom}" ?`)) return;
    this.apiService.deleteProfil(this.selectedProfil.id).subscribe({
      next: () => {
        this.selectedProfil = null;
        this.loadProfils();
      },
      error: (err) => this.profilError = extraireMessageErreur(err, 'Erreur lors de la suppression du profil.')
    });
  }

  openCreateProfilModal(): void {
    this.newProfilForm = { nom: '', description: '' };
    this.createProfilError = '';
    this.showCreateProfilModal = true;
  }

  createProfil(): void {
    this.createProfilError = '';
    this.apiService.createProfil({ ...this.newProfilForm, permissionCodes: [] }).subscribe({
      next: (profil) => {
        this.showCreateProfilModal = false;
        this.loadProfils();
        this.selectProfil(profil);
      },
      error: (err) => this.createProfilError = extraireMessageErreur(err, 'Erreur lors de la création du profil.')
    });
  }

  saveTarifsExamens(): void {
    this.tarifsError = '';
    this.tarifsSuccess = false;
    this.savingTarifs = true;
    this.apiService.updateTarifsExamens(this.tarifsForm).subscribe({
      next: (res) => {
        this.savingTarifs = false;
        this.tarifsForm = { ...res };
        this.tarifsSuccess = true;
      },
      error: (err) => {
        this.savingTarifs = false;
        this.tarifsError = extraireMessageErreur(err, "Erreur lors de l'enregistrement des tarifs.");
      }
    });
  }

  /** Formats acceptés par le backend (voir ConfigurationController.validateImage) : un
   *  fichier hors de cette liste (HEIC, GIF, capture d'écran exotique, etc.) est rejeté ici
   *  avec un message clair, plutôt que de découvrir l'échec seulement à l'enregistrement. */
  private readonly TYPES_IMAGE_ACCEPTES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.TYPES_IMAGE_ACCEPTES.includes(file.type)) {
      this.identiteError = `Format d'image non pris en charge pour le logo (${file.type || 'inconnu'}). Utilisez un fichier JPG, PNG ou WebP.`;
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.identiteError = 'Le logo ne doit pas dépasser 2 Mo.';
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.identiteForm.logoData = reader.result as string;
      this.identiteError = '';
    };
    reader.readAsDataURL(file);
  }

  onImageConnexionSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.TYPES_IMAGE_ACCEPTES.includes(file.type)) {
      this.identiteError = `Format d'image non pris en charge pour l'image de connexion (${file.type || 'inconnu'}). Utilisez un fichier JPG, PNG ou WebP.`;
      input.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.identiteError = "L'image de connexion ne doit pas dépasser 3 Mo. Compressez-la avant de la téléverser.";
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.identiteForm.imageConnexion = reader.result as string;
      this.identiteError = '';
    };
    reader.readAsDataURL(file);
  }

  retirerImageConnexion(): void {
    this.identiteForm.imageConnexion = null;
  }

  saveIdentite(): void {
    this.identiteError = '';
    this.identiteSuccess = false;
    this.savingIdentite = true;
    this.apiService.updateIdentite(this.identiteForm).subscribe({
      next: (res) => {
        this.savingIdentite = false;
        this.identiteForm = { ...res };
        this.identiteSuccess = true;
      },
      error: (err) => {
        this.savingIdentite = false;
        if (err.status === 0) {
          this.identiteError = 'Impossible de contacter le serveur, ou les images sont trop volumineuses pour la connexion actuelle. Réessayez avec des images plus légères.';
        } else {
          this.identiteError = extraireMessageErreur(err, "Erreur lors de l'enregistrement de l'identité.");
        }
      }
    });
  }

  openCatModal(): void {
    this.isEditCat = false;
    this.selectedCatId = null;
    this.catForm = { code: '', libelle: '', montant: null, description: '', actif: true };
    this.catError = '';
    this.showCatModal = true;
  }

  editCat(c: CategoriePermis): void {
    this.isEditCat = true;
    this.selectedCatId = c.id;
    this.catForm = { code: c.code, libelle: c.libelle, montant: c.montant, description: c.description, actif: c.actif };
    this.catError = '';
    this.showCatModal = true;
  }

  saveCat(): void {
    this.catError = '';
    if (this.isEditCat && this.selectedCatId) {
      this.apiService.updateCategorie(this.selectedCatId, this.catForm).subscribe({
        next: () => {
          this.showCatModal = false;
          this.loadData();
        },
        error: (err) => this.catError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement de la catégorie.')
      });
    } else {
      this.apiService.createCategorie(this.catForm).subscribe({
        next: () => {
          this.showCatModal = false;
          this.loadData();
        },
        error: (err) => this.catError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement de la catégorie.')
      });
    }
  }

  openSiteModal(): void {
    this.isEditSite = false;
    this.selectedSiteId = null;
    this.siteForm = { nom: '', adresse: '', actif: true };
    this.siteError = '';
    this.showSiteModal = true;
  }

  editSite(s: Site): void {
    this.isEditSite = true;
    this.selectedSiteId = s.id;
    this.siteForm = { nom: s.nom, adresse: s.adresse, actif: s.actif };
    this.siteError = '';
    this.showSiteModal = true;
  }

  saveSite(): void {
    this.siteError = '';
    if (this.isEditSite && this.selectedSiteId) {
      this.apiService.updateSite(this.selectedSiteId, this.siteForm).subscribe({
        next: () => {
          this.showSiteModal = false;
          this.loadData();
        },
        error: (err) => this.siteError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement du site.')
      });
    } else {
      this.apiService.createSite(this.siteForm).subscribe({
        next: () => {
          this.showSiteModal = false;
          this.loadData();
        },
        error: (err) => this.siteError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement du site.')
      });
    }
  }
}
