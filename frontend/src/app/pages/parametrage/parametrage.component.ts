import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CategoriePermis, Identite, Site, SiteStat } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

type OngletParametrage = 'identite' | 'categories' | 'tarifs' | 'sites' | 'stats';
const ONGLETS_VALIDES: OngletParametrage[] = ['identite', 'categories', 'tarifs', 'sites', 'stats'];

@Component({
    selector: 'app-parametrage',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="parametrage-page">
      <div class="page-header-bar">
        <div>
          <h2>Paramètres Généraux</h2>
          <p>Identité de l'auto-école, tarifs, catégories de permis et sites de formation</p>
        </div>
      </div>

      <!-- SOUS-ONGLETS -->
      <div class="tabs-header">
        <button class="tab-btn" [class.active]="activeTab === 'identite'" (click)="activeTab = 'identite'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          Identité
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'categories'" (click)="activeTab = 'categories'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L19 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
          Catégories de Permis
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'tarifs'" (click)="activeTab = 'tarifs'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
          Tarifs des Examens
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'sites'" (click)="activeTab = 'sites'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="9" y1="12" x2="9" y2="12.01"/><line x1="9" y1="15" x2="9" y2="15.01"/><line x1="9" y1="18" x2="9" y2="18.01"/></svg>
          Sites de Formation
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'stats'" (click)="activeTab = 'stats'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Statistiques par Site
        </button>
      </div>

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
            <p class="form-help">Utilisés par Caisse & Trésorerie pour calculer automatiquement le montant à décaisser lors d'une prise en charge des frais d'examen.</p>
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

    .tabs-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: var(--bg-card);
      padding: 0.4rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      width: fit-content;
      max-width: 100%;
      /* Filet de sécurité si les libellés d'onglets ne tiennent pas sur un petit téléphone :
         on défile horizontalement plutôt que de déborder de la page. */
      overflow-x: auto;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      white-space: nowrap;
      background: transparent;
      border: none;
      padding: 0.55rem 1.1rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    .tab-btn:hover { color: var(--text-main); }
    .tab-btn.active {
      background: var(--primary);
      color: white;
      box-shadow: var(--shadow-sm);
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

    .logo-settings {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      /* Un input file natif refuse de rétrécir sous sa largeur intrinsèque : sans ça, il
         déborde de cette colonne étroite et chevauche la colonne des champs à côté. */
      min-width: 0;
      width: 100%;
    }
    .logo-settings input[type="file"] { max-width: 100%; }
    .logo-preview { width: 7rem; height: 7rem; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0.75rem; background: #eff6ff; color: #2563eb; font-size: 2.5rem; }
    .logo-preview img { width: 100%; height: 100%; object-fit: contain; }
    .form-help { color: var(--text-muted); font-size: 0.8rem; margin: 0; }
    .tarifs-examens-form { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 0.75rem; }
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

  identiteForm: Identite = { logoData: null, nomEtablissement: '', telephone: '', email: '', adresseSiege: '' };
  identiteError = '';
  identiteSuccess = false;
  savingIdentite = false;

  tarifsForm: any = { prixExamenCode: 0, prixExamenCreneau: 0, prixExamenCirculation: 0 };
  tarifsError = '';
  tarifsSuccess = false;
  savingTarifs = false;

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

  loadData(): void {
    this.apiService.getCategories().subscribe({ next: (res) => this.categories = res });
    this.apiService.getSites().subscribe({ next: (res) => this.sites = res });
    this.apiService.getStatistiquesSites().subscribe({ next: (res) => this.statsSites = res });
    this.apiService.getIdentite().subscribe({ next: (res) => this.identiteForm = { ...res } });
    this.apiService.getTarifsExamens().subscribe({ next: (res) => this.tarifsForm = { ...res } });
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

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.identiteError = 'Le logo ne doit pas dépasser 2 Mo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.identiteForm.logoData = reader.result as string;
      this.identiteError = '';
    };
    reader.readAsDataURL(file);
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
        this.identiteError = extraireMessageErreur(err, "Erreur lors de l'enregistrement de l'identité.");
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
