import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NatureOperation, RecapCaisse, TransactionCaisse } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-caisse',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="caisse-page">
      <!-- HEADER -->
      <div class="page-header-bar">
        <div>
          <h2>Caisse & Trésorerie</h2>
          <p>Caisse de dépenses et recettes diverses, indépendante des paiements de formation (suivis dans l'onglet Paiements)</p>
        </div>
        <div class="header-buttons">
          <button class="btn btn-outline btn-sm" [disabled]="refreshing" (click)="actualiser()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            {{ refreshing ? 'Actualisation...' : 'Actualiser' }}
          </button>
          @if (activeTab === 'operations') {
            <button class="btn btn-outline btn-sm" (click)="exportPdf()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Journal PDF
            </button>
            <button class="btn btn-outline btn-sm" (click)="exportExcel()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Journal Excel
            </button>
            @if (canAdd) {
              <button class="btn btn-primary" (click)="openNewTxModal()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Nouvelle Opération
              </button>
            }
          }
          @if (activeTab === 'natures' && isAdmin) {
            <button class="btn btn-primary" (click)="openCreateNatureModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Nouvelle Nature d'opération
            </button>
          }
        </div>
      </div>

      <!-- RECAP STATS -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Solde Actuel de Caisse</div>
            <div class="stat-value">{{ (recap?.soldeCaisse || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub">Total Entrées − Sorties</div>
          </div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total des Recettes</div>
            <div class="stat-value">{{ (recap?.totalEntrees || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub text-success">Aujourd'hui : +{{ (recap?.totalEntreesJour || 0) | number }} FCFA</div>
          </div>
        </div>

        <div class="stat-card danger">
          <div class="stat-icon danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total des Dépenses</div>
            <div class="stat-value">{{ (recap?.totalSorties || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub text-danger">Aujourd'hui : -{{ (recap?.totalSortiesJour || 0) | number }} FCFA</div>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon info">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Solde du Jour</div>
            <div class="stat-value" [ngClass]="(recap?.soldeJour || 0) >= 0 ? 'text-success' : 'text-danger'">
              {{ (recap?.soldeJour || 0) | number }} <small>FCFA</small>
            </div>
            <div class="stat-sub">Activité journalière</div>
          </div>
        </div>
      </div>

      <!-- SOUS-ONGLETS -->
      <div class="tabs-header">
        <button class="tab-btn" [class.active]="activeTab === 'operations'" (click)="switchTab('operations')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Opérations
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'natures'" (click)="switchTab('natures')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          Natures d'opération
        </button>
      </div>

      <!-- ===================== ONGLET OPÉRATIONS ===================== -->
      @if (activeTab === 'operations') {
        <div class="card filter-card">
          <div class="filter-grid">
            <div>
              <select class="form-control" [(ngModel)]="typeFiltre" (change)="loadTransactions()">
                <option value="">Tous les sens</option>
                <option value="ENTREE">Recettes uniquement</option>
                <option value="SORTIE">Dépenses uniquement</option>
              </select>
            </div>
            <div>
              <select class="form-control" [(ngModel)]="natureFiltreId" (change)="loadTransactions()">
                <option [ngValue]="null">Toutes les natures d'opération</option>
                @for (n of naturesActives; track n.id) {
                  <option [ngValue]="n.id">{{ n.libelle }}</option>
                }
              </select>
            </div>
            <div>
              <button class="btn btn-secondary" (click)="resetFiltres()">Réinitialiser</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Nature d'opération</th>
                  <th>Sens</th>
                  <th>Libellé de l'opération</th>
                  <th>N° Facture</th>
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
                    <td colspan="8" class="text-center py-4">Aucune opération de caisse trouvée.</td>
                  </tr>
                }
                @for (tx of transactions; track tx) {
                  <tr>
                    <td>{{ tx.dateTransaction | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <strong>{{ tx.natureOperation.libelle }}</strong>
                      @if (tx.natureOperation.planComptable) {
                        <div class="sub-text">Plan comptable : {{ tx.natureOperation.planComptable }}</div>
                      }
                    </td>
                    <td>
                      <span class="badge" [ngClass]="tx.typeMouvement === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                        @if (tx.typeMouvement === 'ENTREE') {
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                        } @else {
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
                        }
                        {{ tx.typeMouvement === 'ENTREE' ? 'RECETTE' : 'DÉPENSE' }}
                      </span>
                    </td>
                    <td>{{ tx.libelle }}</td>
                    <td><code>{{ tx.numeroFacture || '—' }}</code></td>
                    <td>
                      <strong [ngClass]="tx.typeMouvement === 'ENTREE' ? 'text-success' : 'text-danger'">
                        {{ tx.typeMouvement === 'ENTREE' ? '+' : '-' }}{{ tx.montant | number }} FCFA
                      </strong>
                    </td>
                    <td>{{ tx.utilisateurNomComplet }}</td>
                    @if (isAdmin) {
                      <td class="text-right">
                        <button class="btn btn-danger btn-sm" (click)="openDeleteModal(tx)" title="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </td>
                    }
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
              <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} opérations)</span>
              <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">
                Suivant
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          }
        </div>
      }

      <!-- ===================== ONGLET NATURES D'OPÉRATION ===================== -->
      @if (activeTab === 'natures') {
        <div class="card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th>Sens</th>
                  <th>Plan comptable</th>
                  <th>Description</th>
                  <th>Statut</th>
                  @if (isAdmin) {
                    <th class="text-right">Action</th>
                  }
                </tr>
              </thead>
              <tbody>
                @if (loadingNatures) {
                  <tr>
                    <td colspan="7" class="text-center py-4">Chargement des natures d'opération...</td>
                  </tr>
                }
                @if (!loadingNatures && naturesToutes.length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-4">Aucune nature d'opération définie. Créez-en une pour pouvoir enregistrer des opérations.</td>
                  </tr>
                }
                @for (n of naturesToutes; track n.id) {
                  <tr [class.inactive-row]="!n.actif">
                    <td><code>{{ n.code }}</code></td>
                    <td><strong>{{ n.libelle }}</strong></td>
                    <td>
                      <span class="badge" [ngClass]="n.sens === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                        {{ n.sens === 'ENTREE' ? 'RECETTE' : 'DÉPENSE' }}
                      </span>
                    </td>
                    <td>{{ n.planComptable || '—' }}</td>
                    <td><small class="text-muted">{{ n.description || '—' }}</small></td>
                    <td>
                      @if (n.actif) {
                        <span class="badge badge-solde">Active</span>
                      } @else {
                        <span class="badge badge-expire">Inactive</span>
                      }
                    </td>
                    @if (isAdmin) {
                      <td class="text-right">
                        <button class="btn btn-outline btn-sm" (click)="openEditNatureModal(n)" title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL NOUVELLE OPÉRATION -->
      @if (showNewTxModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
                Enregistrer une Opération de Caisse
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showNewTxModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveTransaction()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ formError }}
                  </div>
                }
                @if (naturesActives.length === 0) {
                  <div class="alert alert-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Aucune nature d'opération active. Créez-en une dans l'onglet "Natures d'opération" avant d'enregistrer une opération.
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Nature d'opération <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="newTx.natureOperationId" name="natureOperationId" required (change)="onNatureChange()">
                    <option [ngValue]="null">-- Sélectionner --</option>
                    @for (n of naturesActives; track n.id) {
                      <option [ngValue]="n.id">{{ n.libelle }} ({{ n.sens === 'ENTREE' ? 'Recette' : 'Dépense' }})</option>
                    }
                  </select>
                </div>

                @if (selectedNature) {
                  <div class="form-group">
                    <label class="form-label">Sens</label>
                    <div>
                      <span class="badge" [ngClass]="selectedNature.sens === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                        {{ selectedNature.sens === 'ENTREE' ? 'RECETTE' : 'DÉPENSE' }}
                      </span>
                      <span class="form-help" style="display:inline; margin-left:0.5rem;">déterminé automatiquement par la nature choisie</span>
                    </div>
                  </div>
                }

                <div class="form-group">
                  <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="newTx.montant" name="montant" required placeholder="Ex: 15000" />
                </div>

                <div class="form-group">
                  <label class="form-label">Libellé descriptif <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="newTx.libelle" name="libelle" required placeholder="Ex: Achat carburant véhicule permis B" />
                </div>

                <div class="form-group">
                  <label class="form-label">Numéro de facture</label>
                  <input type="text" class="form-control" [(ngModel)]="newTx.numeroFacture" name="numeroFacture" placeholder="Ex: FACT-2026-089" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showNewTxModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving || !isFormValide()">
                  {{ saving ? 'Enregistrement...' : 'Valider l\\'Opération' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL NATURE D'OPÉRATION -->
      @if (showNatureModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                @if (isEditNature) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                }
                {{ isEditNature ? 'Modifier la Nature d\\'opération' : 'Nouvelle Nature d\\'opération' }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showNatureModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveNature()">
              <div class="modal-body">
                @if (natureFormError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ natureFormError }}
                  </div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Code <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="natureForm.code" name="code" required [disabled]="isEditNature" placeholder="Ex: 601-CARB" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sens <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="natureForm.sens" name="sens" required [disabled]="isEditNature">
                      <option value="ENTREE">Recette</option>
                      <option value="SORTIE">Dépense</option>
                    </select>
                    @if (isEditNature) {
                      <div class="form-help">Non modifiable après création (préserve la cohérence des opérations déjà enregistrées)</div>
                    }
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Libellé <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="natureForm.libelle" name="libelle" required placeholder="Ex: Achat carburant" />
                </div>
                <div class="form-group">
                  <label class="form-label">Plan comptable</label>
                  <input type="text" class="form-control" [(ngModel)]="natureForm.planComptable" name="planComptable" placeholder="Ex: 601" />
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="natureForm.description" name="description"></textarea>
                </div>
                @if (isEditNature) {
                  <div class="form-group form-check">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="natureForm.actif" name="actif" />
                      Nature active (utilisable pour de nouvelles opérations)
                    </label>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showNatureModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="savingNature || !natureForm.code || !natureForm.libelle">
                  {{ savingNature ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL SUPPRESSION -->
      @if (showDeleteModal && targetTx) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Confirmation de Suppression
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showDeleteModal = false">✕</button>
            </div>
            <div class="modal-body">
              <p>Supprimer définitivement l'opération <strong>{{ targetTx.libelle }}</strong> de {{ targetTx.montant | number }} FCFA ?</p>
              <div class="form-group mt-3">
                <label class="form-label">Motif de suppression <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="deleteMotif" name="deleteMotif" placeholder="Ex: Erreur de saisie" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteModal = false">Annuler</button>
              <button type="button" class="btn btn-danger" (click)="confirmDelete()">Supprimer</button>
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

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1.5fr 1.5fr 0.5fr;
      gap: 1rem;
    }

    .tabs-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      background: var(--bg-card);
      padding: 0.4rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      width: fit-content;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
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
    .inactive-row { opacity: 0.55; }

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

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      cursor: pointer;
    }
  `]
})
export class CaisseComponent implements OnInit {
  activeTab: 'operations' | 'natures' = 'operations';

  transactions: TransactionCaisse[] = [];
  recap: RecapCaisse | null = null;
  loading = false;
  saving = false;
  refreshing = false;

  typeFiltre = '';
  natureFiltreId: number | null = null;
  page = 0;
  totalPages = 0;
  totalElements = 0;

  naturesActives: NatureOperation[] = [];
  naturesToutes: NatureOperation[] = [];
  loadingNatures = false;

  showNewTxModal = false;
  newTx: { natureOperationId: number | null; montant: number | null; libelle: string; numeroFacture: string } = {
    natureOperationId: null,
    montant: null,
    libelle: '',
    numeroFacture: ''
  };
  formError = '';

  showNatureModal = false;
  isEditNature = false;
  editingNatureId: number | null = null;
  natureForm: { code: string; libelle: string; sens: 'ENTREE' | 'SORTIE'; planComptable: string; description: string; actif: boolean } = {
    code: '', libelle: '', sens: 'SORTIE', planComptable: '', description: '', actif: true
  };
  natureFormError = '';
  savingNature = false;

  showDeleteModal = false;
  targetTx: TransactionCaisse | null = null;
  deleteMotif = '';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadRecap();
    this.loadTransactions();
    this.loadNaturesActives();
    this.loadNaturesToutes();
  }

  get canAdd(): boolean {
    return this.authService.hasRole(['ADMIN', 'CAISSIERE']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  get selectedNature(): NatureOperation | null {
    return this.naturesActives.find(n => n.id === this.newTx.natureOperationId) || null;
  }

  switchTab(tab: 'operations' | 'natures'): void {
    this.activeTab = tab;
  }

  /** Rafraîchit tout ce qui peut avoir changé sans passer par cet écran. */
  actualiser(): void {
    this.refreshing = true;
    let restants = 3;
    const termine = () => { if (--restants <= 0) this.refreshing = false; };
    this.apiService.getRecapCaisse().subscribe({
      next: (r) => { this.recap = r; termine(); },
      error: (err) => { console.error(err); termine(); }
    });
    this.apiService.getTransactionsCaisse(this.typeFiltre, this.natureFiltreId || undefined, this.page).subscribe({
      next: (res) => {
        this.transactions = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        termine();
      },
      error: (err) => { console.error(err); termine(); }
    });
    this.apiService.getToutesNaturesOperation().subscribe({
      next: (res) => { this.naturesToutes = res; this.naturesActives = res.filter(n => n.actif); termine(); },
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
    this.apiService.getTransactionsCaisse(this.typeFiltre, this.natureFiltreId || undefined, this.page).subscribe({
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

  loadNaturesActives(): void {
    this.apiService.getNaturesOperation().subscribe({
      next: (res) => this.naturesActives = res,
      error: (err) => console.error(err)
    });
  }

  loadNaturesToutes(): void {
    this.loadingNatures = true;
    this.apiService.getToutesNaturesOperation().subscribe({
      next: (res) => { this.naturesToutes = res; this.loadingNatures = false; },
      error: (err) => { console.error(err); this.loadingNatures = false; }
    });
  }

  changePage(p: number): void {
    this.page = p;
    this.loadTransactions();
  }

  resetFiltres(): void {
    this.typeFiltre = '';
    this.natureFiltreId = null;
    this.page = 0;
    this.loadTransactions();
  }

  // ============== OPÉRATIONS ==============

  openNewTxModal(): void {
    this.formError = '';
    this.newTx = { natureOperationId: null, montant: null, libelle: '', numeroFacture: '' };
    this.showNewTxModal = true;
  }

  onNatureChange(): void {
    this.formError = '';
  }

  isFormValide(): boolean {
    return !!this.newTx.natureOperationId && !!this.newTx.montant && this.newTx.montant > 0 && !!this.newTx.libelle;
  }

  saveTransaction(): void {
    if (!this.isFormValide()) return;

    this.saving = true;
    this.formError = '';

    this.apiService.enregistrerTransactionCaisse({
      natureOperationId: this.newTx.natureOperationId!,
      montant: this.newTx.montant!,
      libelle: this.newTx.libelle,
      numeroFacture: this.newTx.numeroFacture || undefined
    }).subscribe({
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
    this.targetTx = tx;
    this.deleteMotif = '';
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.targetTx) return;
    this.apiService.deleteTransactionCaisse(this.targetTx.id, this.deleteMotif || undefined).subscribe({
      next: () => {
        this.showDeleteModal = false;
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

  // ============== NATURES D'OPÉRATION ==============

  openCreateNatureModal(): void {
    this.isEditNature = false;
    this.editingNatureId = null;
    this.natureFormError = '';
    this.natureForm = { code: '', libelle: '', sens: 'SORTIE', planComptable: '', description: '', actif: true };
    this.showNatureModal = true;
  }

  openEditNatureModal(n: NatureOperation): void {
    this.isEditNature = true;
    this.editingNatureId = n.id;
    this.natureFormError = '';
    this.natureForm = {
      code: n.code,
      libelle: n.libelle,
      sens: n.sens,
      planComptable: n.planComptable || '',
      description: n.description || '',
      actif: n.actif
    };
    this.showNatureModal = true;
  }

  saveNature(): void {
    this.savingNature = true;
    this.natureFormError = '';

    if (this.isEditNature && this.editingNatureId) {
      this.apiService.updateNatureOperation(this.editingNatureId, {
        libelle: this.natureForm.libelle,
        planComptable: this.natureForm.planComptable || undefined,
        description: this.natureForm.description || undefined,
        actif: this.natureForm.actif
      }).subscribe({
        next: () => {
          this.savingNature = false;
          this.showNatureModal = false;
          this.loadNaturesToutes();
          this.loadNaturesActives();
        },
        error: (err) => {
          this.savingNature = false;
          this.natureFormError = extraireMessageErreur(err, 'Erreur lors de la modification.');
        }
      });
    } else {
      this.apiService.createNatureOperation({
        code: this.natureForm.code,
        libelle: this.natureForm.libelle,
        sens: this.natureForm.sens,
        planComptable: this.natureForm.planComptable || undefined,
        description: this.natureForm.description || undefined
      }).subscribe({
        next: () => {
          this.savingNature = false;
          this.showNatureModal = false;
          this.loadNaturesToutes();
          this.loadNaturesActives();
        },
        error: (err) => {
          this.savingNature = false;
          this.natureFormError = extraireMessageErreur(err, 'Erreur lors de la création.');
        }
      });
    }
  }
}
