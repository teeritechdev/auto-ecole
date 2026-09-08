import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { RecapCaisse, TransactionCaisse } from '../../core/models/models';

@Component({
    selector: 'app-caisse',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="caisse-page">
      <!-- HEADER -->
      <div class="page-header-bar">
        <div>
          <h2>Gestion de la Caisse & Trésorerie</h2>
          <p>Suivi global des entrées, sorties et du solde de caisse de l'auto-école</p>
        </div>
        <div class="header-buttons">
          <button class="btn btn-outline btn-sm" (click)="exportPdf()">📄 Journal PDF</button>
          <button class="btn btn-outline btn-sm" (click)="exportExcel()">📊 Journal Excel</button>
          @if (canAdd) {
            <button class="btn btn-primary" (click)="openNewTxModal()">
              ➕ Nouveau Mouvement
            </button>
          }
        </div>
      </div>
    
      <!-- RECAP STATS -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon primary">🏦</div>
          <div class="stat-info">
            <div class="stat-label">Solde Actuel de Caisse</div>
            <div class="stat-value">{{ (recap?.soldeCaisse || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub">Total Entrées − Sorties</div>
          </div>
        </div>
    
        <div class="stat-card success">
          <div class="stat-icon success">📥</div>
          <div class="stat-info">
            <div class="stat-label">Total des Entrées (Recettes)</div>
            <div class="stat-value">{{ (recap?.totalEntrees || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub text-success">Aujourd'hui : +{{ (recap?.totalEntreesJour || 0) | number }} FCFA</div>
          </div>
        </div>
    
        <div class="stat-card danger">
          <div class="stat-icon danger">📤</div>
          <div class="stat-info">
            <div class="stat-label">Total des Sorties (Dépenses)</div>
            <div class="stat-value">{{ (recap?.totalSorties || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub text-danger">Aujourd'hui : -{{ (recap?.totalSortiesJour || 0) | number }} FCFA</div>
          </div>
        </div>
    
        <div class="stat-card info">
          <div class="stat-icon info">📊</div>
          <div class="stat-info">
            <div class="stat-label">Solde du Jour</div>
            <div class="stat-value" [ngClass]="(recap?.soldeJour || 0) >= 0 ? 'text-success' : 'text-danger'">
              {{ (recap?.soldeJour || 0) | number }} <small>FCFA</small>
            </div>
            <div class="stat-sub">Activité journalière</div>
          </div>
        </div>
      </div>
    
      <!-- FILTERS -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div>
            <select class="form-control" [(ngModel)]="typeFiltre" (change)="loadTransactions()">
              <option value="">Tous les types de mouvements</option>
              <option value="ENTREE">📥 Entrées uniquement (Recettes)</option>
              <option value="SORTIE">📤 Sorties uniquement (Dépenses)</option>
            </select>
          </div>
          <div>
            <input type="text" class="form-control" placeholder="Filtrer par catégorie..." [(ngModel)]="catFiltre" (keyup.enter)="loadTransactions()" />
          </div>
          <div>
            <button class="btn btn-secondary" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>
    
      <!-- TABLE TRANSACTIONS -->
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Type</th>
                <th>Libellé de l'opération</th>
                <th>Catégorie</th>
                <th>Réf. Pièce</th>
                <th>Montant</th>
                <th>Opérateur</th>
                @if (isAdmin) {
                  <th class="text-right">Action</th>
                }
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="8" class="text-center py-4">Chargement du journal de caisse...</td>
                </tr>
              }
              @if (!loading && transactions.length === 0) {
                <tr>
                  <td colspan="8" class="text-center py-4">Aucune transaction de caisse trouvée.</td>
                </tr>
              }
              @for (tx of transactions; track tx) {
                <tr>
                  <td>{{ tx.dateTransaction | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="badge" [ngClass]="tx.typeMouvement === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                      {{ tx.typeMouvement === 'ENTREE' ? '📥 ENTRÉE' : '📤 SORTIE' }}
                    </span>
                  </td>
                  <td><strong>{{ tx.libelle }}</strong></td>
                  <td><span class="cat-pill">{{ tx.categorie || 'Général' }}</span></td>
                  <td><code>{{ tx.referencePiece || '—' }}</code></td>
                  <td>
                    <strong [ngClass]="tx.typeMouvement === 'ENTREE' ? 'text-success' : 'text-danger'">
                      {{ tx.typeMouvement === 'ENTREE' ? '+' : '-' }}{{ tx.montant | number }} FCFA
                    </strong>
                  </td>
                  <td>{{ tx.utilisateurNomComplet }}</td>
                  @if (isAdmin) {
                    <td class="text-right">
                      <button class="btn btn-danger btn-sm" (click)="openDeleteModal(tx)">🗑️</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
    
        @if (totalPages > 1) {
          <div class="pagination-bar">
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changePage(page - 1)">◀ Précédent</button>
            <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} mouvements)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">Suivant ▶</button>
          </div>
        }
      </div>
    
      <!-- MODAL NOUVEAU MOUVEMENT -->
      @if (showNewTxModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>🏦 Enregistrer un Mouvement de Caisse</h3>
              <button class="btn btn-outline btn-sm" (click)="showNewTxModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveTransaction()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">⚠️ {{ formError }}</div>
                }
                <div class="form-group">
                  <label class="form-label">Type de mouvement <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="newTx.typeMouvement" name="typeMouvement" required>
                    <option value="ENTREE">📥 ENTRÉE (Recette / Encaissement)</option>
                    <option value="SORTIE">📤 SORTIE (Dépense / Charge / Achat)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="newTx.montant" name="montant" required placeholder="Ex: 15000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Libellé descriptif <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="newTx.libelle" name="libelle" required placeholder="Ex: Achat carburant véhicule permis B" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Catégorie</label>
                    <input type="text" class="form-control" [(ngModel)]="newTx.categorie" name="categorie" placeholder="Ex: CARBURANT, CHARGES, ENTRETIEN..." />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Référence Pièce / Facture</label>
                    <input type="text" class="form-control" [(ngModel)]="newTx.referencePiece" name="referencePiece" placeholder="Ex: FACT-2026-089" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showNewTxModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving || !newTx.montant || !newTx.libelle">
                  {{ saving ? 'Enregistrement...' : 'Valider le Mouvement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
    `,
    styles: [`
    .page-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1.5fr 1.5fr 0.5fr;
      gap: 1rem;
    }

    .cat-pill {
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .text-right { text-align: right; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }
  `]
})
export class CaisseComponent implements OnInit {
  transactions: TransactionCaisse[] = [];
  recap: RecapCaisse | null = null;
  loading = false;
  saving = false;

  typeFiltre = '';
  catFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  showNewTxModal = false;
  newTx: any = {
    typeMouvement: 'ENTREE',
    montant: null,
    libelle: '',
    categorie: '',
    referencePiece: ''
  };
  formError = '';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadRecap();
    this.loadTransactions();
  }

  get canAdd(): boolean {
    return this.authService.hasRole(['ADMIN', 'CAISSIERE']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  loadRecap(): void {
    this.apiService.getRecapCaisse().subscribe({
      next: (r) => this.recap = r,
      error: (err) => console.error(err)
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.apiService.getTransactionsCaisse(this.typeFiltre, this.catFiltre, this.page).subscribe({
      next: (res) => {
        this.transactions = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  changePage(p: number): void {
    this.page = p;
    this.loadTransactions();
  }

  resetFiltres(): void {
    this.typeFiltre = '';
    this.catFiltre = '';
    this.page = 0;
    this.loadTransactions();
  }

  openNewTxModal(): void {
    this.formError = '';
    this.newTx = {
      typeMouvement: 'ENTREE',
      montant: null,
      libelle: '',
      categorie: '',
      referencePiece: ''
    };
    this.showNewTxModal = true;
  }

  saveTransaction(): void {
    if (!this.newTx.montant || !this.newTx.libelle) return;

    this.saving = true;
    this.formError = '';

    this.apiService.enregistrerTransactionCaisse(this.newTx).subscribe({
      next: () => {
        this.saving = false;
        this.showNewTxModal = false;
        this.loadRecap();
        this.loadTransactions();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Erreur lors de l’enregistrement.';
      }
    });
  }

  openDeleteModal(tx: TransactionCaisse): void {
    const motif = prompt('Veuillez saisir le motif de suppression de la transaction :');
    if (!motif) return;

    this.apiService.deleteTransactionCaisse(tx.id, motif).subscribe({
      next: () => {
        this.loadRecap();
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Erreur lors de la suppression.')
    });
  }

  exportPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCaissePdfUrl(), 'journal_caisse.pdf');
  }

  exportExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCaisseExcelUrl(), 'journal_caisse.xlsx');
  }
}
