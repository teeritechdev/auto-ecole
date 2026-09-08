import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, CategoriePermis, Forfait } from '../../core/models/models';

@Component({
    selector: 'app-candidats',
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="candidats-page">
      <!-- HEADER ACTIONS -->
      <div class="page-header-bar">
        <div>
          <h2>Gestion des Candidats & Dossiers</h2>
          <p>Consultez, enregistrez et suivez les parcours administratifs et forfaits</p>
        </div>
        <div class="header-buttons">
          @if (canSeeFinancialData) {
            <button class="btn btn-outline btn-sm" (click)="exporterPdf()">📄 Export PDF</button>
          }
          @if (canSeeFinancialData) {
            <button class="btn btn-outline btn-sm" (click)="exporterExcel()">📊 Export Excel</button>
          }
          @if (canEdit) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              ➕ Inscrire un Candidat
            </button>
          }
        </div>
      </div>
    
      <!-- FILTER BAR -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="form-control"
              placeholder="Rechercher par nom, prénom, N° dossier, téléphone..."
              [(ngModel)]="recherche"
              (keyup.enter)="loadCandidats()"
              />
          </div>
    
          <div>
            <select class="form-control" [(ngModel)]="statutFiltre" (change)="loadCandidats()">
              <option value="">Tous les statuts</option>
              <option value="EN_COURS">En cours</option>
              <option value="SOLDE">Soldé</option>
              <option value="EXPIRE">Expiré</option>
              <option value="EXPIRE_NON_SOLDE">Expiré non soldé</option>
            </select>
          </div>
    
          <div>
            <select class="form-control" [(ngModel)]="categorieFiltre" (change)="loadCandidats()">
              <option value="">Toutes les catégories</option>
              @for (cat of categories; track cat) {
                <option [value]="cat.id">{{ cat.code }} - {{ cat.libelle }}</option>
              }
            </select>
          </div>
    
          <div>
            <button class="btn btn-secondary btn-block" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>
    
      <!-- CANDIDATS TABLE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Candidat</th>
                <th>Contact</th>
                <th>{{ canSeeFinancialData ? 'Permis / Forfait' : 'Permis' }}</th>
                @if (canSeeFinancialData) {
                  <th>Montant</th>
                }
                @if (canSeeFinancialData) {
                  <th>Versé / Reste</th>
                }
                <th>Statut</th>
                <th>Échéance</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td [attr.colspan]="canSeeFinancialData ? 9 : 7" class="text-center py-4">Chargement des candidats...</td>
                </tr>
              }
              @if (!loading && candidats.length === 0) {
                <tr>
                  <td [attr.colspan]="canSeeFinancialData ? 9 : 7" class="text-center py-4">Aucun candidat trouvé pour ces critères.</td>
                </tr>
              }
              @for (c of candidats; track c) {
                <tr>
                  <td>
                    <strong class="dossier-code">{{ c.numeroDossier }}</strong>
                  </td>
                  <td>
                    <div class="candidat-name">{{ c.nom }} {{ c.prenom }}</div>
                    <small class="text-muted">Inscrit le {{ c.dateInscription | date:'dd/MM/yyyy' }}</small>
                  </td>
                  <td>
                    <div>📞 {{ c.telephone }}</div>
                    @if (c.email) {
                      <small class="text-muted">✉️ {{ c.email }}</small>
                    }
                  </td>
                  <td>
                    <span class="badge badge-programme">{{ c.categoriePermisCode }}</span>
                    @if (canSeeFinancialData) {
                      <div class="forfait-sub">{{ c.forfaitNom }}</div>
                    }
                  </td>
                  @if (canSeeFinancialData) {
                    <td>
                      <strong>{{ c.montantForfait | number }} FCFA</strong>
                    </td>
                  }
                  @if (canSeeFinancialData) {
                    <td>
                      <div class="text-success font-semibold">{{ c.totalVerse | number }} FCFA</div>
                      <small [ngClass]="c.soldeRestant > 0 ? 'text-danger' : 'text-muted'">
                        Reste : {{ c.soldeRestant | number }} FCFA
                      </small>
                    </td>
                  }
                  <td>
                  <span class="badge" [ngClass]="{
                    'badge-solde': c.statutDossier === 'SOLDE',
                    'badge-en-cours': c.statutDossier === 'EN_COURS',
                    'badge-expire': c.statutDossier === 'EXPIRE',
                    'badge-expire-non-solde': c.statutDossier === 'EXPIRE_NON_SOLDE'
                  }">
                      {{ c.statutDossier }}
                    </span>
                  </td>
                  <td>
                    <div [ngClass]="{'text-warning font-semibold': c.procheExpiration}">
                      {{ c.dateEcheance | date:'dd/MM/yyyy' }}
                    </div>
                    @if (c.procheExpiration) {
                      <small class="badge badge-ajourne">Expire bientôt</small>
                    }
                  </td>
                  <td class="text-right">
                    <div class="table-actions">
                      <a [routerLink]="['/candidats', c.id]" class="btn btn-outline btn-sm" title="Fiche complète">
                        👁️ Détails
                      </a>
                      @if (canEdit) {
                        <button class="btn btn-outline btn-sm" (click)="openEditModal(c)" title="Modifier">
                          ✏️
                        </button>
                      }
                      @if (isAdmin) {
                        <button class="btn btn-danger btn-sm" (click)="openDeleteModal(c)" title="Supprimer">
                          🗑️
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
    
        <!-- PAGINATION -->
        @if (totalPages > 1) {
          <div class="pagination-bar">
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changePage(page - 1)">
              ◀ Précédent
            </button>
            <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} candidats)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">
              Suivant ▶
            </button>
          </div>
        }
      </div>
    
      <!-- MODAL CRÉATION CANDIDAT -->
      @if (showCreateModal) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3>📝 Inscription d'un Nouveau Candidat</h3>
              <button class="btn btn-outline btn-sm" (click)="showCreateModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveCreateCandidat()">
              <div class="modal-body">
                @if (modalError) {
                  <div class="alert alert-danger">⚠️ {{ modalError }}</div>
                }
                <h4 class="section-title">1. Informations Personnelles</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Nom de famille <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="newCandidat.nom" name="nom" required placeholder="Ex: KOUADIO" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Prénom(s) <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="newCandidat.prenom" name="prenom" required placeholder="Ex: Jean-Luc" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Date de naissance <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="newCandidat.dateNaissance" name="dateNaissance" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Lieu de naissance</label>
                    <input type="text" class="form-control" [(ngModel)]="newCandidat.lieuNaissance" name="lieuNaissance" placeholder="Ex: Cocody, Abidjan" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Numéro Téléphone <span class="required">*</span></label>
                    <input type="tel" class="form-control" [(ngModel)]="newCandidat.telephone" name="telephone" required placeholder="Ex: 0701020304" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Adresse Email</label>
                    <input type="email" class="form-control" [(ngModel)]="newCandidat.email" name="email" placeholder="candidat@email.com" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Autres contacts utiles / Personne à prévenir</label>
                  <input type="text" class="form-control" [(ngModel)]="newCandidat.contactsUrgence" name="contactsUrgence" placeholder="Nom et téléphone du contact d'urgence" />
                </div>
                <h4 class="section-title">2. Inscription & Forfait</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Catégorie de permis <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newCandidat.categoriePermisId" name="categoriePermisId" required>
                      @for (cat of categories; track cat) {
                        <option [value]="cat.id">{{ cat.code }} — {{ cat.libelle }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Forfait sélectionné <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newCandidat.forfaitId" name="forfaitId" required>
                      @for (f of forfaits; track f) {
                        <option [value]="f.id">{{ f.nom }} ({{ f.montant | number }} FCFA)</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Date d'inscription <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="newCandidat.dateInscription" name="dateInscription" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date de réception dossier</label>
                    <input type="date" class="form-control" [(ngModel)]="newCandidat.dateReceptionDossier" name="dateReceptionDossier" />
                  </div>
                </div>
                <h4 class="section-title">3. Premier Versement (Optionnel à l'inscription — Règle RG02 : 35 000 à 50 000 FCFA)</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Montant du 1er versement (FCFA)</label>
                    <input type="number" class="form-control" [(ngModel)]="newCandidat.montantPremierVersement" name="montantPremierVersement" placeholder="Ex: 40000" min="35000" max="50000" />
                    <small class="text-muted">Si versé : doit être compris entre 35 000 et 50 000 FCFA.</small>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Mode de règlement</label>
                    <select class="form-control" [(ngModel)]="newCandidat.modeReglementPremierVersement" name="modeReglementPremierVersement">
                      <option value="ESPECES">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile Money (Wave / Orange / MTN / Moov)</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="CHEQUE">Chèque</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  {{ saving ? 'Enregistrement...' : 'Enregistrer le Candidat' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    
      <!-- MODAL SUPPRESSION -->
      @if (showDeleteModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>⚠️ Confirmation de Suppression</h3>
              <button class="btn btn-outline btn-sm" (click)="showDeleteModal = false">✕</button>
            </div>
            <div class="modal-body">
              <p>Êtes-vous certain de vouloir supprimer définitivement le dossier <strong>{{ selectedCandidat?.numeroDossier }}</strong> de <strong>{{ selectedCandidat?.nom }} {{ selectedCandidat?.prenom }}</strong> ?</p>
              <div class="form-group mt-3">
                <label class="form-label">Motif de suppression (obligatoire pour traçabilité) <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="deleteMotif" placeholder="Ex: Erreur de saisie / Désistement" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteModal = false">Annuler</button>
              <button type="button" class="btn btn-danger" [disabled]="!deleteMotif" (click)="confirmDelete()">Confirmer la Suppression</button>
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

    .header-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 0.8fr;
      gap: 1rem;
    }

    .dossier-code {
      font-family: monospace;
      color: var(--primary);
      font-size: 0.95rem;
    }

    .candidat-name {
      font-weight: 600;
      color: var(--text-main);
    }

    .forfait-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .table-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;
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

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary);
      margin: 1.25rem 0 0.75rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--border-color);
    }

    .mt-3 { margin-top: 1rem; }
    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }
  `]
})
export class CandidatsComponent implements OnInit {
  candidats: Candidat[] = [];
  categories: CategoriePermis[] = [];
  forfaits: Forfait[] = [];
  loading = false;
  saving = false;

  recherche = '';
  statutFiltre = '';
  categorieFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  showCreateModal = false;
  showDeleteModal = false;
  selectedCandidat: Candidat | null = null;
  deleteMotif = '';
  modalError = '';

  newCandidat: any = {
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    telephone: '',
    email: '',
    contactsUrgence: '',
    dateInscription: new Date().toISOString().substring(0, 10),
    categoriePermisId: null,
    forfaitId: null,
    montantPremierVersement: null,
    modeReglementPremierVersement: 'ESPECES'
  };

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadParams();
    this.loadCandidats();
  }

  get canEdit(): boolean {
    return this.authService.hasRole(['ADMIN', 'SECRETAIRE']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  get canSeeFinancialData(): boolean {
    return this.authService.hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE']);
  }

  loadParams(): void {
    this.apiService.getCategories(true).subscribe({
      next: (res) => {
        this.categories = res;
        if (this.categories.length > 0) this.newCandidat.categoriePermisId = this.categories[0].id;
      }
    });
    this.apiService.getForfaits(true).subscribe({
      next: (res) => {
        this.forfaits = res;
        if (this.forfaits.length > 0) this.newCandidat.forfaitId = this.forfaits[0].id;
      }
    });
  }

  loadCandidats(): void {
    this.loading = true;
    const catId = this.categorieFiltre ? Number(this.categorieFiltre) : undefined;
    this.apiService.getCandidats(this.recherche, this.statutFiltre, catId, this.page).subscribe({
      next: (res) => {
        this.candidats = res.content || [];
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
    this.loadCandidats();
  }

  resetFiltres(): void {
    this.recherche = '';
    this.statutFiltre = '';
    this.categorieFiltre = '';
    this.page = 0;
    this.loadCandidats();
  }

  openCreateModal(): void {
    this.modalError = '';
    this.newCandidat = {
      nom: '',
      prenom: '',
      dateNaissance: '',
      lieuNaissance: '',
      telephone: '',
      email: '',
      contactsUrgence: '',
      dateInscription: new Date().toISOString().substring(0, 10),
      categoriePermisId: this.categories.length > 0 ? this.categories[0].id : null,
      forfaitId: this.forfaits.length > 0 ? this.forfaits[0].id : null,
      montantPremierVersement: null,
      modeReglementPremierVersement: 'ESPECES'
    };
    this.showCreateModal = true;
  }

  openEditModal(c: Candidat): void {
    // Open edit logic or navigate to detail
  }

  saveCreateCandidat(): void {
    if (this.newCandidat.montantPremierVersement) {
      if (this.newCandidat.montantPremierVersement < 35000 || this.newCandidat.montantPremierVersement > 50000) {
        this.modalError = 'Règle RG02 : Le 1er versement doit obligatoirement être compris entre 35 000 et 50 000 FCFA.';
        return;
      }
    }

    this.saving = true;
    this.modalError = '';

    this.apiService.createCandidat(this.newCandidat).subscribe({
      next: () => {
        this.saving = false;
        this.showCreateModal = false;
        this.loadCandidats();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = err.error?.message || 'Erreur lors de la création du candidat.';
      }
    });
  }

  openDeleteModal(c: Candidat): void {
    this.selectedCandidat = c;
    this.deleteMotif = '';
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedCandidat || !this.deleteMotif) return;

    this.apiService.deleteCandidat(this.selectedCandidat.id, this.deleteMotif).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.loadCandidats();
      },
      error: (err) => alert(err.error?.message || 'Erreur lors de la suppression.')
    });
  }

  exporterPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsPdfUrl(), 'candidats_auto_ecole.pdf');
  }

  exporterExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsExcelUrl(), 'candidats_auto_ecole.xlsx');
  }
}
