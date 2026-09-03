import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CategoriePermis, Forfait } from '../../core/models/models';

@Component({
  selector: 'app-parametrage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="parametrage-page">
      <div class="page-header-bar">
        <div>
          <h2>Paramétrage du Système</h2>
          <p>Configurez les forfaits de formation (RG01) et les catégories de permis de conduire</p>
        </div>
      </div>

      <div class="grid-2-col">
        <!-- 1. FORFAITS -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📦 Forfaits de Formation (RG01)</div>
            <button class="btn btn-primary btn-sm" (click)="openForfaitModal()">➕ Nouveau Forfait</button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Nom du Forfait</th>
                  <th>Montant</th>
                  <th>Description</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of forfaits">
                  <td><strong>{{ f.nom }}</strong></td>
                  <td><strong class="text-success">{{ f.montant | number }} FCFA</strong></td>
                  <td><small class="text-muted">{{ f.description || '—' }}</small></td>
                  <td class="text-right">
                    <button class="btn btn-outline btn-sm" (click)="editForfait(f)">✏️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. CATÉGORIES DE PERMIS -->
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
                  <th>Description</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of categories">
                  <td><span class="badge badge-programme">{{ cat.code }}</span></td>
                  <td><strong>{{ cat.libelle }}</strong></td>
                  <td><small class="text-muted">{{ cat.description || '—' }}</small></td>
                  <td class="text-right">
                    <button class="btn btn-outline btn-sm" (click)="editCat(cat)">✏️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL FORFAIT -->
      <div class="modal-backdrop" *ngIf="showForfaitModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditForfait ? '✏️ Modifier le Forfait' : '➕ Nouveau Forfait' }}</h3>
            <button class="btn btn-outline btn-sm" (click)="showForfaitModal = false">✕</button>
          </div>
          <form (ngSubmit)="saveForfait()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom du forfait <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="forfaitForm.nom" name="nom" required placeholder="Ex: Forfait Accéléré" />
              </div>
              <div class="form-group">
                <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="forfaitForm.montant" name="montant" required placeholder="Ex: 150000" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-control" rows="2" [(ngModel)]="forfaitForm.description" name="description"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showForfaitModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CATEGORIE -->
      <div class="modal-backdrop" *ngIf="showCatModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditCat ? '✏️ Modifier la Catégorie' : '➕ Nouvelle Catégorie de Permis' }}</h3>
            <button class="btn btn-outline btn-sm" (click)="showCatModal = false">✕</button>
          </div>
          <form (ngSubmit)="saveCat()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Code Catégorie <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="catForm.code" name="code" required placeholder="Ex: D" [disabled]="isEditCat" />
              </div>
              <div class="form-group">
                <label class="form-label">Libellé <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="catForm.libelle" name="libelle" required placeholder="Ex: Permis D Transport en commun" />
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
    </div>
  `,
  styles: [`
    .page-header-bar {
      margin-bottom: 1.5rem;
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 1.5rem;
    }

    .text-right { text-align: right; }
    .text-success { color: #15803d; }
  `]
})
export class ParametrageComponent implements OnInit {
  forfaits: Forfait[] = [];
  categories: CategoriePermis[] = [];

  showForfaitModal = false;
  isEditForfait = false;
  selectedForfaitId: number | null = null;
  forfaitForm: any = { nom: '', montant: null, description: '', actif: true };

  showCatModal = false;
  isEditCat = false;
  selectedCatId: number | null = null;
  catForm: any = { code: '', libelle: '', description: '', actif: true };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getForfaits().subscribe({ next: (res) => this.forfaits = res });
    this.apiService.getCategories().subscribe({ next: (res) => this.categories = res });
  }

  openForfaitModal(): void {
    this.isEditForfait = false;
    this.selectedForfaitId = null;
    this.forfaitForm = { nom: '', montant: null, description: '', actif: true };
    this.showForfaitModal = true;
  }

  editForfait(f: Forfait): void {
    this.isEditForfait = true;
    this.selectedForfaitId = f.id;
    this.forfaitForm = { nom: f.nom, montant: f.montant, description: f.description, actif: f.actif };
    this.showForfaitModal = true;
  }

  saveForfait(): void {
    if (this.isEditForfait && this.selectedForfaitId) {
      this.apiService.updateForfait(this.selectedForfaitId, this.forfaitForm).subscribe({
        next: () => {
          this.showForfaitModal = false;
          this.loadData();
        }
      });
    } else {
      this.apiService.createForfait(this.forfaitForm).subscribe({
        next: () => {
          this.showForfaitModal = false;
          this.loadData();
        }
      });
    }
  }

  openCatModal(): void {
    this.isEditCat = false;
    this.selectedCatId = null;
    this.catForm = { code: '', libelle: '', description: '', actif: true };
    this.showCatModal = true;
  }

  editCat(c: CategoriePermis): void {
    this.isEditCat = true;
    this.selectedCatId = c.id;
    this.catForm = { code: c.code, libelle: c.libelle, description: c.description, actif: c.actif };
    this.showCatModal = true;
  }

  saveCat(): void {
    if (this.isEditCat && this.selectedCatId) {
      this.apiService.updateCategorie(this.selectedCatId, this.catForm).subscribe({
        next: () => {
          this.showCatModal = false;
          this.loadData();
        }
      });
    } else {
      this.apiService.createCategorie(this.catForm).subscribe({
        next: () => {
          this.showCatModal = false;
          this.loadData();
        }
      });
    }
  }
}
