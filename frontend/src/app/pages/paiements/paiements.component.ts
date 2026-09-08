import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, Paiement, Recu } from '../../core/models/models';

@Component({
    selector: 'app-paiements',
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="paiements-page">
      <!-- HEADER -->
      <div class="page-header-bar">
        <div>
          <h2>Gestion des Paiements & Reçus</h2>
          <p>Enregistrez les versements, imprimez les reçus officiels et contrôlez les soldes</p>
        </div>
        <div class="header-buttons">
          @if (canAdd) {
            <button class="btn btn-primary" (click)="openNewPaiementModal()">
              💵 Nouvel Encaissement
            </button>
          }
        </div>
      </div>
    
      <!-- FILTERS -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div>
            <select class="form-control" [(ngModel)]="statutFiltre" (change)="loadPaiements()">
              <option value="">Tous les statuts</option>
              <option value="VALIDE">Valide</option>
              <option value="MODIFIE">Modifié</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <div>
            <button class="btn btn-secondary" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>
    
      <!-- TABLE PAIEMENTS -->
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>N° Reçu</th>
                <th>Date & Heure</th>
                <th>Candidat (N° Dossier)</th>
                <th>Type de Versement</th>
                <th>Montant</th>
                <th>Mode Règlement</th>
                <th>Agent</th>
                <th>Statut</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center py-4">Chargement des versements...</td>
                </tr>
              }
              @if (!loading && paiements.length === 0) {
                <tr>
                  <td colspan="9" class="text-center py-4">Aucun versement trouvé.</td>
                </tr>
              }
              @for (p of paiements; track p) {
                <tr>
                  <td><strong class="dossier-code">{{ p.numeroRecu || '-' }}</strong></td>
                  <td>{{ p.datePaiement | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <strong>{{ p.candidatNomComplet }}</strong>
                    <div class="sub-text">{{ p.candidatNumeroDossier }}</div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="p.typeVersement === 'PREMIER_VERSEMENT' ? 'badge-programme' : 'badge-solde'">
                      {{ p.typeVersement === 'PREMIER_VERSEMENT' ? '1er Versement' : 'Versement Suivant' }}
                    </span>
                  </td>
                  <td><strong class="text-success">{{ p.montant | number }} FCFA</strong></td>
                  <td>{{ p.modeReglement }}</td>
                  <td>{{ p.utilisateurNomComplet }}</td>
                  <td>
                  <span class="badge" [ngClass]="{
                    'badge-solde': p.statut === 'VALIDE',
                    'badge-expire': p.statut === 'ANNULE',
                    'badge-ajourne': p.statut === 'MODIFIE'
                  }">{{ p.statut }}</span>
                    @if (p.motifModification) {
                      <div class="motif-text">Motif : {{ p.motifModification }}</div>
                    }
                  </td>
                  <td class="text-right">
                    <div class="action-flex">
                      @if (p.recuId) {
                        <button class="btn btn-outline btn-sm" (click)="imprimerRecu(p.recuId)" title="Télécharger Reçu PDF">
                          🖨️ Reçu PDF
                        </button>
                      }
                      @if (canAdd && p.statut !== 'ANNULE') {
                        <button class="btn btn-outline btn-sm" (click)="openEditModal(p)" title="Modifier">
                          ✏️
                        </button>
                      }
                      @if (canAdd && p.statut !== 'ANNULE') {
                        <button class="btn btn-danger btn-sm" (click)="openCancelModal(p)" title="Annuler">
                          ✕
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
    
        @if (totalPages > 1) {
          <div class="pagination-bar">
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changePage(page - 1)">◀ Précédent</button>
            <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} versements)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">Suivant ▶</button>
          </div>
        }
      </div>
    
      <!-- MODAL NOUVEL ENCAISSEMENT -->
      @if (showNewModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>💵 Nouvel Encaissement</h3>
              <button class="btn btn-outline btn-sm" (click)="showNewModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveNewPaiement()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">⚠️ {{ formError }}</div>
                }
                <div class="form-group">
                  <label class="form-label">Sélectionner le candidat <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="selectedCandidatId" name="candidatId" (change)="onCandidatSelect()" required>
                    <option [ngValue]="null">-- Sélectionner un candidat --</option>
                    @for (c of nonSoldesCandidats; track c) {
                      <option [value]="c.id">
                        {{ c.numeroDossier }} — {{ c.nom }} {{ c.prenom }} (Reste : {{ c.soldeRestant | number }} FCFA)
                      </option>
                    }
                  </select>
                </div>
                @if (selectedCandidat) {
                  <div class="alert alert-info">
                    Forfait : <strong>{{ selectedCandidat.forfaitNom }} ({{ selectedCandidat.montantForfait | number }} FCFA)</strong><br>
                    Déjà versé : <strong>{{ selectedCandidat.totalVerse | number }} FCFA</strong><br>
                    Reste à payer : <strong class="text-danger">{{ selectedCandidat.soldeRestant | number }} FCFA</strong>
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Montant à encaisser (FCFA) <span class="required">*</span></label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="newMontant"
                    name="montant"
                    [max]="selectedCandidat?.soldeRestant || 999999"
                    required
                    placeholder="Ex: 35000"
                    />
                </div>
                <div class="form-group">
                  <label class="form-label">Mode de règlement <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="newMode" name="mode" required>
                    <option value="ESPECES">Espèces</option>
                    <option value="MOBILE_MONEY">Mobile Money (Wave / Orange / MTN / Moov)</option>
                    <option value="VIREMENT">Virement bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Annuler</button>
                <button type="submit" class="btn btn-success" [disabled]="saving || !selectedCandidatId || !newMontant">
                  {{ saving ? 'Validation...' : 'Valider & Générer Reçu' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    
      <!-- MODAL MODIFICATION PAIEMENT (avec motif RG10) -->
      @if (showEditModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>✏️ Modifier un Versement (Traçabilité RG10)</h3>
              <button class="btn btn-outline btn-sm" (click)="showEditModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveEditPaiement()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">⚠️ {{ formError }}</div>
                }
                <div class="form-group">
                  <label class="form-label">Nouveau Montant (FCFA) <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="editMontant" name="editMontant" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Mode de règlement <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="editMode" name="editMode" required>
                    <option value="ESPECES">Espèces</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="VIREMENT">Virement bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Motif de la modification (obligatoire) <span class="required">*</span></label>
                  <textarea class="form-control" rows="2" [(ngModel)]="editMotif" name="editMotif" placeholder="Justification de la modification" required></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showEditModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving || !editMotif || !editMontant">
                  {{ saving ? 'Mise à jour...' : 'Confirmer la modification' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    
      <!-- MODAL ANNULATION PAIEMENT -->
      @if (showCancelModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>✕ Annuler un Versement</h3>
              <button class="btn btn-outline btn-sm" (click)="showCancelModal = false">✕</button>
            </div>
            <form (ngSubmit)="confirmCancelPaiement()">
              <div class="modal-body">
                <p>Êtes-vous certain de vouloir annuler le versement de <strong>{{ targetPaiement?.montant | number }} FCFA</strong> pour <strong>{{ targetPaiement?.candidatNomComplet }}</strong> ?</p>
                <p class="text-danger mt-2"><small>Cette action déduira automatiquement le montant du solde du candidat et créera un mouvement compensatoire de caisse.</small></p>
                <div class="form-group mt-3">
                  <label class="form-label">Motif d'annulation obligatoire <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="cancelMotif" name="cancelMotif" placeholder="Ex: Chèque sans provision, Erreur caisse..." required />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCancelModal = false">Fermer</button>
                <button type="submit" class="btn btn-danger" [disabled]="!cancelMotif || saving">
                  {{ saving ? 'Annulation...' : 'Confirmer l’Annulation' }}
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
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
    }

    .dossier-code {
      font-family: monospace;
      color: var(--primary);
    }

    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .motif-text {
      font-size: 0.72rem;
      color: #9a3412;
      font-style: italic;
      margin-top: 0.15rem;
    }

    .action-flex {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
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

    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
    .text-right { text-align: right; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }
  `]
})
export class PaiementsComponent implements OnInit {
  paiements: Paiement[] = [];
  nonSoldesCandidats: Candidat[] = [];
  loading = false;
  saving = false;

  statutFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  showNewModal = false;
  selectedCandidatId: number | null = null;
  selectedCandidat: Candidat | null = null;
  newMontant = 0;
  newMode = 'ESPECES';
  formError = '';

  showEditModal = false;
  targetPaiement: Paiement | null = null;
  editMontant = 0;
  editMode = 'ESPECES';
  editMotif = '';

  showCancelModal = false;
  cancelMotif = '';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadPaiements();
    this.loadNonSoldesCandidats();
  }

  get canAdd(): boolean {
    return this.authService.hasRole(['ADMIN', 'CAISSIERE']);
  }

  loadPaiements(): void {
    this.loading = true;
    this.apiService.getPaiements(undefined, this.statutFiltre, this.page).subscribe({
      next: (res) => {
        this.paiements = res.content || [];
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

  loadNonSoldesCandidats(): void {
    this.apiService.getCandidats('', 'EN_COURS', undefined, 0, 100).subscribe({
      next: (res) => this.nonSoldesCandidats = res.content || []
    });
  }

  changePage(p: number): void {
    this.page = p;
    this.loadPaiements();
  }

  resetFiltres(): void {
    this.statutFiltre = '';
    this.page = 0;
    this.loadPaiements();
  }

  openNewPaiementModal(): void {
    this.formError = '';
    this.selectedCandidatId = null;
    this.selectedCandidat = null;
    this.newMontant = 0;
    this.newMode = 'ESPECES';
    this.showNewModal = true;
  }

  onCandidatSelect(): void {
    if (this.selectedCandidatId) {
      this.selectedCandidat = this.nonSoldesCandidats.find(c => c.id == this.selectedCandidatId) || null;
      if (this.selectedCandidat) {
        this.newMontant = this.selectedCandidat.soldeRestant;
      }
    } else {
      this.selectedCandidat = null;
    }
  }

  saveNewPaiement(): void {
    if (!this.selectedCandidatId || !this.newMontant) return;

    this.saving = true;
    this.formError = '';

    this.apiService.enregistrerPaiement({
      candidatId: Number(this.selectedCandidatId),
      montant: this.newMontant,
      modeReglement: this.newMode
    }).subscribe({
      next: (res) => {
        this.saving = false;
        this.showNewModal = false;
        this.loadPaiements();
        this.loadNonSoldesCandidats();
        if (res.recuId) this.imprimerRecu(res.recuId);
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Erreur lors de l’enregistrement.';
      }
    });
  }

  openEditModal(p: Paiement): void {
    this.targetPaiement = p;
    this.editMontant = p.montant;
    this.editMode = p.modeReglement;
    this.editMotif = '';
    this.formError = '';
    this.showEditModal = true;
  }

  saveEditPaiement(): void {
    if (!this.targetPaiement || !this.editMotif || !this.editMontant) return;

    this.saving = true;
    this.formError = '';

    this.apiService.modifierPaiement(this.targetPaiement.id, {
      montant: this.editMontant,
      modeReglement: this.editMode,
      motif: this.editMotif
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showEditModal = false;
        this.loadPaiements();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Erreur lors de la modification.';
      }
    });
  }

  openCancelModal(p: Paiement): void {
    this.targetPaiement = p;
    this.cancelMotif = '';
    this.showCancelModal = true;
  }

  confirmCancelPaiement(): void {
    if (!this.targetPaiement || !this.cancelMotif) return;

    this.saving = true;
    this.apiService.annulerPaiement(this.targetPaiement.id, { motif: this.cancelMotif }).subscribe({
      next: () => {
        this.saving = false;
        this.showCancelModal = false;
        this.loadPaiements();
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Erreur lors de l’annulation.');
      }
    });
  }

  imprimerRecu(recuId: number): void {
    this.apiService.downloadBlob(this.apiService.getRecuPdfUrl(recuId), `recu_officiel_${recuId}.pdf`);
  }
}
