import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, Paiement, Recu, ResumePaiements, Site } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-paiements',
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="paiements-page">
      <!-- HEADER -->
      <div class="page-header-bar">
        <div>
          <h2>Gestion des Paiements & Reçus</h2>
        </div>
        <div class="header-buttons">
          <button class="btn btn-outline btn-sm" [disabled]="refreshing" (click)="actualiser()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            {{ refreshing ? 'Actualisation...' : 'Actualiser' }}
          </button>
          @if (canAdd) {
            <button class="btn btn-primary" (click)="openNewPaiementModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Nouvel Encaissement
            </button>
          }
        </div>
      </div>

      <!-- RÉSUMÉ ENCAISSEMENTS -->
      <div class="resume-bar">
        <div class="resume-box resume-encaisse">
          <div class="resume-label">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            Total encaissé
          </div>
          <div class="resume-value">{{ (resume?.totalEncaisse || 0) | number }} FCFA</div>
        </div>
        <div class="resume-box resume-reste">
          <div class="resume-label">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Reste à payer
          </div>
          <div class="resume-value">{{ (resume?.totalReste || 0) | number }} FCFA</div>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div>
            <select class="form-control" [(ngModel)]="siteFiltre" (change)="loadPaiements()">
              <option value="">Tous les sites</option>
              @for (s of sites; track s) {
                <option [value]="s.id">{{ s.nom }}</option>
              }
            </select>
          </div>
          <div>
            <input type="date" class="form-control" [(ngModel)]="dateDebutFiltre" (change)="loadPaiements()" title="Du" />
          </div>
          <div>
            <input type="date" class="form-control" [(ngModel)]="dateFinFiltre" (change)="loadPaiements()" title="Au" />
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
                <th>Montant</th>
                <th>Reste à payer</th>
                <th>Mode Règlement</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="7" class="text-center py-4">Chargement des versements...</td>
                </tr>
              }
              @if (!loading && paiements.length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-4">Aucun versement trouvé.</td>
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
                  <td><strong class="text-success">{{ p.montant | number }} FCFA</strong></td>
                  <td><strong class="text-danger">{{ (p.soldeRestant || 0) | number }} FCFA</strong></td>
                  <td>{{ p.modeReglement }}</td>
                  <td class="text-right">
                    <div class="action-flex">
                      @if (p.recuId) {
                        <button class="btn btn-outline btn-xs" (click)="imprimerRecu(p.recuId)" title="Télécharger Reçu PDF">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                        <button class="btn btn-outline btn-xs" (click)="imprimerDirectement(p.recuId)" title="Imprimer directement">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        </button>
                      }
                      @if (canAdd) {
                        <button class="btn btn-outline btn-xs" (click)="openEditModal(p)" title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                      }
                      @if (canAdd) {
                        <button class="btn btn-danger btn-xs" (click)="openCancelModal(p)" title="Annuler ce versement">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
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
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changePage(page - 1)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Précédent
            </button>
            <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} versements)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">
              Suivant
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        }
      </div>
    
      <!-- MODAL NOUVEL ENCAISSEMENT -->
      @if (showNewModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Nouvel Encaissement
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showNewModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveNewPaiement()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ formError }}
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Sélectionner le candidat</label>
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
                  <div class="financial-summary-card">
                    <div class="summary-col">
                      <span class="summary-label">Total à payer</span>
                      <span class="summary-value value-total">{{ (selectedCandidat.montantForfait || 0) | number }} FCFA</span>
                    </div>
                    <div class="summary-col">
                      <span class="summary-label">Versé</span>
                      <span class="summary-value value-verse">{{ (selectedCandidat.totalVerse || 0) | number }} FCFA</span>
                    </div>
                    <div class="summary-col">
                      <span class="summary-label">Reste</span>
                      <span class="summary-value value-reste">{{ (selectedCandidat.soldeRestant || 0) | number }} FCFA</span>
                    </div>
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Montant à encaisser (FCFA)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="newMontant"
                    name="montant"
                    [max]="selectedCandidat?.soldeRestant || 999999"
                    required
                    placeholder="Montant libre (ex: 50000, solde total...)"
                    />
                </div>
                <div class="form-group">
                  <label class="form-label">Mode de règlement</label>
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
                <button type="submit" class="btn btn-success" [disabled]="saving || !selectedCandidatId || !newMontant || newMontant <= 0">
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
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Modifier un Versement (Traçabilité RG10)
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showEditModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveEditPaiement()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ formError }}
                  </div>
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
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Annuler un Versement
              </h3>
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

      <!-- MODAL SUCCÈS ENCAISSEMENT — téléchargement du reçu optionnel -->
      @if (showSuccessModal) {
        <div class="modal-backdrop">
          <div class="modal-content" style="max-width: 440px; text-align: center;">
            <div class="modal-header" style="justify-content: flex-end;">
              <button class="btn btn-outline btn-sm" (click)="showSuccessModal = false">✕</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem 2rem;">
              <div style="font-size: 3rem; margin-bottom: 0.75rem;">✅</div>
              <h3 style="margin-bottom: 0.5rem; color: var(--success, #16a34a);">Paiement enregistré !</h3>
              <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.95rem;">
                Le versement a été validé avec succès et le reçu est prêt.
                Vous pouvez le télécharger ou l'imprimer maintenant, ou le retrouver plus tard dans la liste.
              </p>
              @if (dernierRecuId) {
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <button class="btn btn-primary" (click)="imprimerRecu(dernierRecuId!); showSuccessModal = false">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.4rem"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Télécharger le Reçu PDF
                  </button>
                  <button class="btn btn-outline" (click)="imprimerDirectement(dernierRecuId!); showSuccessModal = false">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.4rem"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Imprimer directement
                  </button>
                </div>
              }
            </div>
            <div class="modal-footer" style="justify-content: center;">
              <button class="btn btn-secondary" (click)="showSuccessModal = false">Fermer sans télécharger</button>
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

    .page-header-bar h2 {
      color: var(--primary);
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }

    .resume-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .resume-box {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }

    .resume-box:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .resume-encaisse {
      border-left: 4px solid var(--success);
    }

    .resume-reste {
      border-left: 4px solid var(--accent);
    }

    .resume-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }

    .resume-value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.02em;
    }

    .filter-card {
      margin-bottom: 2rem;
      padding: 1.5rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

    .financial-summary-card {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
      text-align: center;
    }

    .summary-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-col:not(:last-child) {
      border-right: 1px solid #e2e8f0;
      padding-right: 0.5rem;
    }

    .summary-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
    }

    .summary-value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
    }

    .value-total {
      color: #0f172a;
    }

    .value-verse {
      color: #15803d;
    }

    .value-reste {
      color: #b91c1c;
    }
  `]
})
export class PaiementsComponent implements OnInit {
  paiements: Paiement[] = [];
  nonSoldesCandidats: Candidat[] = [];
  loading = false;
  saving = false;

  siteFiltre = '';
  dateDebutFiltre = '';
  dateFinFiltre = '';
  sites: Site[] = [];
  page = 0;
  totalPages = 0;
  totalElements = 0;

  resume: ResumePaiements | null = null;
  refreshing = false;

  showNewModal = false;
  selectedCandidatId: number | null = null;
  selectedCandidat: Candidat | null = null;
  newMontant: number | null = null;
  newMode = 'ESPECES';
  formError = '';

  showEditModal = false;
  targetPaiement: Paiement | null = null;
  editMontant = 0;
  editMode = 'ESPECES';
  editMotif = '';

  showCancelModal = false;
  cancelMotif = '';

  /** Reçu du dernier encaissement validé : null si aucun reçu disponible.
   *  Affiché dans le modal de succès pour laisser l'utilisateur choisir
   *  de télécharger ou d'imprimer — sans téléchargement automatique. */
  showSuccessModal = false;
  dernierRecuId: number | null = null;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadPaiements();
    this.loadNonSoldesCandidats();
    this.loadResume();
    this.apiService.getSites(true).subscribe({ next: (res) => this.sites = res });
  }

  /** Convertit les bornes de date (input HTML "date", sans heure) en horodatages couvrant
   *  la journée entière, pour matcher les paramètres debut/fin (LocalDateTime) du backend. */
  private get debutISO(): string | undefined {
    return this.dateDebutFiltre ? `${this.dateDebutFiltre}T00:00:00` : undefined;
  }

  private get finISO(): string | undefined {
    return this.dateFinFiltre ? `${this.dateFinFiltre}T23:59:59` : undefined;
  }

  private get siteFiltreId(): number | undefined {
    return this.siteFiltre ? Number(this.siteFiltre) : undefined;
  }

  loadResume(): void {
    this.apiService.getResumePaiements().subscribe({
      next: (res) => this.resume = res,
      error: () => this.resume = null
    });
  }

  get canAdd(): boolean {
    return this.authService.hasPermission(['PAIEMENTS_CREER']);
  }

  /** Rafraîchit la liste ET le résumé : un versement peut être enregistré par un autre
   *  utilisateur (autre poste Caisse/Secrétariat) sans que cet écran ne le sache. */
  actualiser(): void {
    this.refreshing = true;
    let restants = 2;
    const termine = () => { if (--restants <= 0) this.refreshing = false; };
    this.apiService.getPaiements(undefined, this.page, 15, this.debutISO, this.finISO, this.siteFiltreId).subscribe({
      next: (res) => {
        this.paiements = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        termine();
      },
      error: (err) => { console.error(err); termine(); }
    });
    this.apiService.getResumePaiements().subscribe({
      next: (res) => { this.resume = res; termine(); },
      error: () => { this.resume = null; termine(); }
    });
  }

  loadPaiements(): void {
    this.loading = true;
    this.apiService.getPaiements(undefined, this.page, 15, this.debutISO, this.finISO, this.siteFiltreId).subscribe({
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
    this.siteFiltre = '';
    this.dateDebutFiltre = '';
    this.dateFinFiltre = '';
    this.page = 0;
    this.loadPaiements();
  }

  openNewPaiementModal(): void {
    this.formError = '';
    this.selectedCandidatId = null;
    this.selectedCandidat = null;
    this.newMontant = null;
    this.newMode = 'ESPECES';
    this.showNewModal = true;
  }

  onCandidatSelect(): void {
    if (this.selectedCandidatId) {
      this.selectedCandidat = this.nonSoldesCandidats.find(c => c.id == this.selectedCandidatId) || null;
    } else {
      this.selectedCandidat = null;
    }
  }

  saveNewPaiement(): void {
    if (!this.selectedCandidatId || !this.newMontant || this.newMontant <= 0) return;

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
        this.loadResume();
        // Mémoriser le recuId et ouvrir le modal de succès — le téléchargement
        // reste un choix de l'utilisateur (bouton "Télécharger" ou "Imprimer").
        this.dernierRecuId = res.recuId || null;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, 'Erreur lors de l\'enregistrement.');
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
        this.loadResume();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, 'Erreur lors de la modification.');
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
        this.loadResume();
      },
      error: (err) => {
        this.saving = false;
        alert(extraireMessageErreur(err, 'Erreur lors de l’annulation.'));
      }
    });
  }

  imprimerRecu(recuId: number): void {
    this.apiService.downloadBlob(this.apiService.getRecuPdfUrl(recuId), `recu_officiel_${recuId}.pdf`);
  }

  imprimerDirectement(recuId: number): void {
    this.apiService.printBlob(this.apiService.getRecuPdfUrl(recuId));
  }
}
