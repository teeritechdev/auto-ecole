import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CategoriePermis, Site, SiteStat } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-parametrage',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="parametrage-page">
      <div class="page-header-bar">
        <div>
          <h2>Paramétrage du Système</h2>
          <p>Configurez les catégories de permis (avec leur tarif) et les sites de formation</p>
        </div>
      </div>

      <div class="grid-2-col">
        <div class="card brand-settings-card">
          <div class="card-header">
            <div class="card-title">🏷️ Logo de l'entreprise</div>
          </div>
          <div class="logo-settings">
            <div class="logo-preview">
              @if (logoData) {
                <img [src]="logoData" alt="Logo actuel" />
              }
              @if (!logoData) {
                <span>🚗</span>
              }
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onLogoSelected($event)" />
            <p class="form-help">Le logo sera affiché sur toutes les pages. JPG, PNG ou WebP, maximum 2 Mo.</p>
            @if (logoError) {
              <div class="alert alert-danger">{{ logoError }}</div>
            }
          </div>
        </div>

        <!-- 1. CATÉGORIES DE PERMIS -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🚗 Catégories de Permis (A1, B, C...)</div>
            <button class="btn btn-primary btn-sm" (click)="openCatModal()">➕ Nouvelle Catégorie</button>
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
                      <button class="btn btn-outline btn-sm" (click)="editCat(cat)">✏️</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. SITES DE FORMATION -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🏢 Sites de Formation</div>
            <button class="btn btn-primary btn-sm" (click)="openSiteModal()">➕ Nouveau Site</button>
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
                      <button class="btn btn-outline btn-sm" (click)="editSite(s)">✏️</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. STATISTIQUES PAR SITE -->
      <div class="card stats-sites-card">
        <div class="card-header">
          <div class="card-title">📊 Statistiques par Site</div>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Site</th>
                <th class="text-right">Candidats Actifs</th>
                <th class="text-right">Montant Encaissé</th>
                <th class="text-right">Solde Restant Dû</th>
              </tr>
            </thead>
            <tbody>
              @if (statsSites.length === 0) {
                <tr>
                  <td colspan="4" class="text-center py-4 text-muted">Aucune donnée pour l'instant.</td>
                </tr>
              }
              @for (stat of statsSites; track stat) {
                <tr>
                  <td><strong>{{ stat.siteNom }}</strong></td>
                  <td class="text-right">{{ stat.nombreCandidatsActifs }}</td>
                  <td class="text-right text-success">{{ stat.montantEncaisse | number }} FCFA</td>
                  <td class="text-right">{{ stat.montantRestantDu | number }} FCFA</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CATEGORIE -->
      @if (showCatModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ isEditCat ? '✏️ Modifier la Catégorie' : '➕ Nouvelle Catégorie de Permis' }}</h3>
              <button class="btn btn-outline btn-sm" (click)="showCatModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveCat()">
              <div class="modal-body">
                @if (catError) {
                  <div class="alert alert-danger">⚠️ {{ catError }}</div>
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
              <h3>{{ isEditSite ? '✏️ Modifier le Site' : '➕ Nouveau Site de Formation' }}</h3>
              <button class="btn btn-outline btn-sm" (click)="showSiteModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveSite()">
              <div class="modal-body">
                @if (siteError) {
                  <div class="alert alert-danger">⚠️ {{ siteError }}</div>
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

    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 1.5rem;
    }

    .stats-sites-card {
      margin-top: 1.5rem;
    }

    .text-right { text-align: right; }
    .text-success { color: #15803d; }
    .logo-settings { display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .logo-preview { width: 7rem; height: 7rem; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0.75rem; background: #eff6ff; color: #2563eb; font-size: 2.5rem; }
    .logo-preview img { width: 100%; height: 100%; object-fit: contain; }
    .form-help { color: var(--text-muted); font-size: 0.8rem; margin: 0; }
  `]
})
export class ParametrageComponent implements OnInit {
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

  logoData: string | null = null;
  logoError = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getCategories().subscribe({ next: (res) => this.categories = res });
    this.apiService.getSites().subscribe({ next: (res) => this.sites = res });
    this.apiService.getStatistiquesSites().subscribe({ next: (res) => this.statsSites = res });
    this.apiService.getLogo().subscribe({ next: (res) => this.logoData = res.logoData });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.logoError = 'Le logo ne doit pas dépasser 2 Mo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.apiService.updateLogo(reader.result as string).subscribe({
        next: response => { this.logoData = response.logoData; this.logoError = ''; },
        error: err => this.logoError = extraireMessageErreur(err, 'Impossible d’enregistrer le logo.')
      });
    };
    reader.readAsDataURL(file);
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
