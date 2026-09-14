import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CandidatConcerne, RecapCaisse, TarifsExamens, TransactionCaisse } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

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
          <button class="btn btn-outline btn-sm" [disabled]="refreshing" (click)="actualiser()">
            {{ refreshing ? '⏳ Actualisation...' : '🔄 Actualiser' }}
          </button>
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

        <div class="stat-card success">
          <div class="stat-icon success">🎓</div>
          <div class="stat-info">
            <div class="stat-label">Disponible — Frais de Formation</div>
            <div class="stat-value">{{ (recap?.disponiblePourPrelevement || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub">Prélevable vers la caisse interne</div>
          </div>
        </div>
      </div>

      <p class="caisse-note">💡 Les versements de formation (encaissements, annulations) apparaissent ci-dessous pour une vue complète de tous les mouvements financiers, mais ne comptent pas dans le Solde de Caisse : celui-ci ne suit que l'argent physiquement dans la caisse interne. Utilisez "Prélèvement sur frais de formation" pour y faire entrer de l'argent déjà encaissé.</p>
    
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
                  <td>
                    <strong>{{ tx.libelle }}</strong>
                    @if (tx.typeOperation === 'FRAIS_EXAMEN') {
                      <div class="sub-text">🎓 {{ tx.candidatsConcernes?.length || 0 }} candidat(s) — {{ tx.typeEpreuveExamen }} du {{ tx.dateExamen | date:'dd/MM/yyyy' }}</div>
                    }
                    @if (tx.typeOperation === 'PRELEVEMENT_FORMATION') {
                      <div class="sub-text">💵 Prélèvement sur frais de formation</div>
                    }
                    @if (tx.typeOperation === 'PAIEMENT_FORMATION') {
                      <div class="sub-text">🧾 Versement de formation — hors Solde de Caisse</div>
                    }
                  </td>
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
                  <select class="form-control" [(ngModel)]="newTx.typeMouvement" name="typeMouvement" required (change)="onTypeMouvementChange()">
                    <option value="ENTREE">📥 ENTRÉE (Recette / Encaissement)</option>
                    <option value="SORTIE">📤 SORTIE (Dépense / Charge / Achat)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Type d'opération <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="newTx.typeOperation" name="typeOperation" required (change)="onTypeOperationChange()">
                    <option value="AUTRE">Autre (saisie libre)</option>
                    @if (newTx.typeMouvement === 'SORTIE') {
                      <option value="FRAIS_EXAMEN">Frais d'examen (prise en charge candidats)</option>
                    }
                    @if (newTx.typeMouvement === 'ENTREE') {
                      <option value="PRELEVEMENT_FORMATION">Prélèvement sur frais de formation</option>
                    }
                  </select>
                </div>

                @if (newTx.typeOperation === 'FRAIS_EXAMEN') {
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Épreuve <span class="required">*</span></label>
                      <select class="form-control" [(ngModel)]="newTx.typeEpreuve" name="typeEpreuve" required (change)="onFraisExamenParamsChange()">
                        <option value="CODE">1. Code de la route</option>
                        <option value="CRENEAU">2. Manœuvre / Créneau</option>
                        <option value="CIRCULATION">3. Conduite en circulation</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Date de l'examen <span class="required">*</span></label>
                      <input type="date" class="form-control" [(ngModel)]="newTx.dateExamen" name="dateExamen" required (change)="onFraisExamenParamsChange()" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Candidats pris en charge</label>
                    @if (loadingCandidatsEligibles) {
                      <div class="form-help">Recherche des candidats programmés...</div>
                    }
                    @if (!loadingCandidatsEligibles && newTx.dateExamen && candidatsEligibles.length === 0) {
                      <div class="form-help">Aucun candidat pris en charge n'est programmé à cette épreuve et cette date.</div>
                    }
                    @if (candidatsEligibles.length > 0) {
                      <div class="candidats-list">
                        @for (c of candidatsEligibles; track c.id) {
                          <label class="candidat-option">
                            <input type="checkbox" [checked]="isCandidatFraisExamenSelected(c.id)" (change)="toggleCandidatFraisExamen(c.id)" />
                            <span class="candidat-option-text">
                              <strong>{{ c.numeroDossier }}</strong>
                              <span>{{ c.nomComplet }}</span>
                            </span>
                          </label>
                        }
                      </div>
                    }
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Nombre de candidats</label>
                      <input class="form-control" type="text" [value]="candidatIdsSelectionnes.length" disabled />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Prix total (FCFA)</label>
                      <input class="form-control" type="text" [value]="montantFraisExamenCalcule | number" disabled />
                    </div>
                  </div>
                } @else if (newTx.typeOperation === 'PRELEVEMENT_FORMATION') {
                  <div class="form-group">
                    <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                    <input type="number" class="form-control" [(ngModel)]="newTx.montant" name="montant" required placeholder="Ex: 15000" />
                    <div class="form-help">Disponible : {{ (recap?.disponiblePourPrelevement || 0) | number }} FCFA</div>
                  </div>
                } @else {
                  <div class="form-group">
                    <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                    <input type="number" class="form-control" [(ngModel)]="newTx.montant" name="montant" required placeholder="Ex: 15000" />
                  </div>
                }

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
                <button type="submit" class="btn btn-primary" [disabled]="saving || !isFormValide()">
                  {{ saving ? 'Enregistrement...' : 'Valider le Mouvement' }}
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

    .caisse-note {
      background: #eff6ff;
      color: #1e40af;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      margin: -0.5rem 0 1.5rem;
    }

    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .form-help {
      margin-top: 0.35rem;
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .candidats-list {
      max-height: 11rem;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background: #fff;
    }

    .candidat-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
    }

    .candidat-option:last-child { border-bottom: 0; }
    .candidat-option:hover { background: #f8fafc; }
    .candidat-option input { width: 1.1rem; height: 1.1rem; flex: 0 0 auto; accent-color: var(--primary); }

    .candidat-option-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-size: 0.85rem;
    }
  `]
})
export class CaisseComponent implements OnInit {
  transactions: TransactionCaisse[] = [];
  recap: RecapCaisse | null = null;
  loading = false;
  saving = false;
  refreshing = false;

  typeFiltre = '';
  catFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  showNewTxModal = false;
  newTx: any = {
    typeMouvement: 'ENTREE',
    typeOperation: 'AUTRE',
    montant: null,
    libelle: '',
    categorie: '',
    referencePiece: '',
    dateExamen: '',
    typeEpreuve: 'CODE'
  };
  formError = '';

  tarifs: TarifsExamens | null = null;
  candidatsEligibles: CandidatConcerne[] = [];
  candidatIdsSelectionnes: number[] = [];
  loadingCandidatsEligibles = false;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadRecap();
    this.loadTransactions();
    this.apiService.getTarifsExamens().subscribe({ next: (res) => this.tarifs = res });
  }

  get canAdd(): boolean {
    return this.authService.hasRole(['ADMIN', 'CAISSIERE']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  /** Rafraîchit le récapitulatif ET la liste : les transactions peuvent changer sans passer
   *  par cet écran (un versement en Paiements, une inscription en Candidats...). */
  actualiser(): void {
    this.refreshing = true;
    let restants = 2;
    const termine = () => { if (--restants <= 0) this.refreshing = false; };
    this.apiService.getRecapCaisse().subscribe({
      next: (r) => { this.recap = r; termine(); },
      error: (err) => { console.error(err); termine(); }
    });
    this.apiService.getTransactionsCaisse(this.typeFiltre, this.catFiltre, this.page).subscribe({
      next: (res) => {
        this.transactions = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        termine();
      },
      error: (err) => { console.error(err); termine(); }
    });
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
      typeOperation: 'AUTRE',
      montant: null,
      libelle: '',
      categorie: '',
      referencePiece: '',
      dateExamen: '',
      typeEpreuve: 'CODE'
    };
    this.candidatsEligibles = [];
    this.candidatIdsSelectionnes = [];
    this.showNewTxModal = true;
  }

  onTypeMouvementChange(): void {
    // FRAIS_EXAMEN n'a de sens que pour une SORTIE, PRELEVEMENT_FORMATION que pour une ENTREE :
    // on revient à AUTRE si le type d'opération choisi n'est plus cohérent.
    this.newTx.typeOperation = 'AUTRE';
    this.candidatsEligibles = [];
    this.candidatIdsSelectionnes = [];
  }

  onTypeOperationChange(): void {
    this.formError = '';
    this.newTx.montant = null;
    this.newTx.libelle = '';
    this.candidatsEligibles = [];
    this.candidatIdsSelectionnes = [];
    if (this.newTx.typeOperation === 'FRAIS_EXAMEN') {
      this.newTx.dateExamen = '';
      this.newTx.typeEpreuve = 'CODE';
    } else if (this.newTx.typeOperation === 'PRELEVEMENT_FORMATION') {
      this.newTx.libelle = 'Prélèvement sur frais de formation';
    }
  }

  onFraisExamenParamsChange(): void {
    if (!this.newTx.dateExamen || !this.newTx.typeEpreuve) {
      this.candidatsEligibles = [];
      this.candidatIdsSelectionnes = [];
      return;
    }
    this.loadingCandidatsEligibles = true;
    this.apiService.getCandidatsEligiblesFraisExamen(this.newTx.typeEpreuve, this.newTx.dateExamen).subscribe({
      next: (res) => {
        this.candidatsEligibles = res;
        this.candidatIdsSelectionnes = res.map(c => c.id);
        this.loadingCandidatsEligibles = false;
        this.newTx.libelle = `Frais d'examen ${this.epreuveLabel(this.newTx.typeEpreuve)} du ${this.newTx.dateExamen}`;
      },
      error: () => {
        this.candidatsEligibles = [];
        this.candidatIdsSelectionnes = [];
        this.loadingCandidatsEligibles = false;
      }
    });
  }

  isCandidatFraisExamenSelected(id: number): boolean {
    return this.candidatIdsSelectionnes.includes(id);
  }

  toggleCandidatFraisExamen(id: number): void {
    this.candidatIdsSelectionnes = this.isCandidatFraisExamenSelected(id)
      ? this.candidatIdsSelectionnes.filter(cid => cid !== id)
      : [...this.candidatIdsSelectionnes, id];
  }

  get montantFraisExamenCalcule(): number {
    const prix = this.prixUnitaireFraisExamen();
    return prix * this.candidatIdsSelectionnes.length;
  }

  private prixUnitaireFraisExamen(): number {
    if (!this.tarifs) return 0;
    switch (this.newTx.typeEpreuve) {
      case 'CODE': return this.tarifs.prixExamenCode || 0;
      case 'CRENEAU': return this.tarifs.prixExamenCreneau || 0;
      case 'CIRCULATION': return this.tarifs.prixExamenCirculation || 0;
      default: return 0;
    }
  }

  private epreuveLabel(t: string): string {
    const labels: Record<string, string> = { CODE: 'Code', CRENEAU: 'Créneau', CIRCULATION: 'Circulation' };
    return labels[t] || t;
  }

  isFormValide(): boolean {
    if (!this.newTx.libelle) return false;
    if (this.newTx.typeOperation === 'FRAIS_EXAMEN') {
      return !!this.newTx.dateExamen && !!this.newTx.typeEpreuve && this.candidatIdsSelectionnes.length > 0;
    }
    return !!this.newTx.montant;
  }

  saveTransaction(): void {
    if (!this.isFormValide()) return;

    this.saving = true;
    this.formError = '';

    const payload: any = {
      typeMouvement: this.newTx.typeMouvement,
      typeOperation: this.newTx.typeOperation,
      libelle: this.newTx.libelle,
      categorie: this.newTx.categorie,
      referencePiece: this.newTx.referencePiece
    };

    if (this.newTx.typeOperation === 'FRAIS_EXAMEN') {
      payload.dateExamen = this.newTx.dateExamen;
      payload.typeEpreuve = this.newTx.typeEpreuve;
      payload.candidatIds = this.candidatIdsSelectionnes;
    } else {
      payload.montant = this.newTx.montant;
    }

    this.apiService.enregistrerTransactionCaisse(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showNewTxModal = false;
        this.loadRecap();
        this.loadTransactions();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement.');
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
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors de la suppression.'))
    });
  }

  exportPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCaissePdfUrl(), 'journal_caisse.pdf');
  }

  exportExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCaisseExcelUrl(), 'journal_caisse.xlsx');
  }
}
