import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NatureOperation, RecapCaisse, Site, TransactionCaisse } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-caisse',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="caisse-page">
      <!-- HEADER -->
      <div class="page-header-bar">
        <div>
          <h2>Caisse Ménu Dépense</h2>
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
            <button class="btn btn-outline btn-sm" (click)="imprimerJournal()" title="Imprimer directement">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer
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
          @if (activeTab === 'natures') {
            <button class="btn btn-outline btn-sm" (click)="exportNaturesPdf()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Export PDF
            </button>
            <button class="btn btn-outline btn-sm" (click)="imprimerNatures()" title="Imprimer directement">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer
            </button>
            <button class="btn btn-outline btn-sm" (click)="exportNaturesExcel()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Export Excel
            </button>
            @if (isAdmin) {
              <button class="btn btn-primary" (click)="openCreateNatureModal()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Nouvelle Nature d'opération
              </button>
            }
          }
        </div>
      </div>

      <!-- RECAP STATS -->
      @if (sitesAutorises.length > 1) {
        <div class="site-indicator">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
          {{ siteFiltre ? ('Caisse du site : ' + siteNomFiltre) : 'Toutes les caisses (consolidé, tous sites)' }}
        </div>
      }
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
      </div>

      <!-- Navigation entre "Opérations" et "Natures d'opération" : via le sous-menu au
           survol de "Caisse Ménu Dépense" dans la barre latérale (plus de barre d'onglets
           redondante ici, cf. Paramètres Généraux). -->

      <!-- ===================== ONGLET OPÉRATIONS ===================== -->
      @if (activeTab === 'operations') {
        <div class="card filter-card">
          <div class="filter-grid">
            @if (sitesAutorises.length > 1) {
              <div>
                <select class="form-control" [(ngModel)]="siteFiltre" (change)="onSiteFiltreChange()">
                  <option [ngValue]="null">Tous les sites (consolidé)</option>
                  @for (s of sitesAutorises; track s.id) {
                    <option [ngValue]="s.id">{{ s.nom }}</option>
                  }
                </select>
              </div>
            }
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
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @if (loading) {
                  <tr>
                    <td colspan="7" class="text-center py-4">Chargement du journal de caisse...</td>
                  </tr>
                }
                @if (!loading && transactions.length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-4">Aucune opération de caisse trouvée.</td>
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
                    <td class="text-right">
                      <div class="action-flex">
                        <button class="btn btn-outline btn-sm" (click)="openDetailModal(tx)" title="Voir le détail">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        @if (isAdmin) {
                          <button class="btn btn-danger btn-sm" (click)="openDeleteModal(tx)" title="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
        <div class="card filter-card">
          <div class="filter-grid">
            <div>
              <input type="text" class="form-control" placeholder="Recherche code, libellé, plan..." [(ngModel)]="natureRechercheFiltre" />
            </div>
            <div>
              <select class="form-control" [(ngModel)]="natureSensFiltre">
                <option value="">Tous les sens</option>
                <option value="ENTREE">Recettes (Entrée)</option>
                <option value="SORTIE">Dépenses (Sortie)</option>
              </select>
            </div>
            <div>
              <select class="form-control" [(ngModel)]="natureActifFiltre">
                <option [ngValue]="null">Tous les statuts</option>
                <option [ngValue]="true">Actives uniquement</option>
                <option [ngValue]="false">Inactives uniquement</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th>Sens</th>
                  <th>Plan comptable</th>
                  <th>Statut</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @if (loadingNatures) {
                  <tr>
                    <td colspan="6" class="text-center py-4">Chargement des natures d'opération...</td>
                  </tr>
                }
                @if (!loadingNatures && naturesFiltrees.length === 0) {
                  <tr>
                    <td colspan="6" class="text-center py-4">Aucune nature d'opération trouvée.</td>
                  </tr>
                }
                @for (n of naturesFiltrees; track n.id) {
                  <tr [class.inactive-row]="!n.actif">
                    <td><code>{{ n.code }}</code></td>
                    <td><strong>{{ n.libelle }}</strong></td>
                    <td>
                      <span class="badge" [ngClass]="n.sens === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                        {{ n.sens === 'ENTREE' ? 'RECETTE' : 'DÉPENSE' }}
                      </span>
                    </td>
                    <td>{{ n.planComptable || '—' }}</td>
                    <td>
                      @if (n.actif) {
                        <span class="badge badge-solde">Active</span>
                      } @else {
                        <span class="badge badge-expire">Inactive</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="action-flex">
                        <button class="btn btn-outline btn-sm" (click)="openDetailNatureModal(n)" title="Voir le détail">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        @if (isAdmin) {
                          <button class="btn btn-outline btn-sm" (click)="openEditNatureModal(n)" title="Modifier">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="openDeleteNatureModal(n)" title="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        }
                      </div>
                    </td>
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
                @if (sitesAutorises.length > 1) {
                  <div class="form-group">
                    <label class="form-label">Site (caisse concernée) <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newTx.siteId" name="siteId" required>
                      <option [ngValue]="null" disabled>-- Sélectionner --</option>
                      @for (s of sitesAutorises; track s.id) {
                        <option [ngValue]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                    <div class="form-help">Chaque site a sa propre caisse : cette opération n'affectera que le solde de ce site.</div>
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

      <!-- MODAL DÉTAIL TRANSACTION -->
      @if (showDetailModal && selectedTxDetail) {
        <div class="modal-backdrop">
          <div class="modal-content" style="max-width: 580px;">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Détail de l'opération de caisse
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showDetailModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Date & Heure</span>
                  <span class="detail-val">{{ selectedTxDetail.dateTransaction | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Sens</span>
                  <span class="detail-val">
                    <span class="badge" [ngClass]="selectedTxDetail.typeMouvement === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                      {{ selectedTxDetail.typeMouvement === 'ENTREE' ? 'RECETTE' : 'DÉPENSE' }}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nature d'opération</span>
                  <span class="detail-val">
                    <strong>{{ selectedTxDetail.natureOperation.libelle }}</strong>
                    @if (selectedTxDetail.natureOperation.code) {
                      <span class="sub-text"> ({{ selectedTxDetail.natureOperation.code }})</span>
                    }
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Plan comptable</span>
                  <span class="detail-val">{{ selectedTxDetail.natureOperation.planComptable || '—' }}</span>
                </div>
                <div class="detail-item full-width">
                  <span class="detail-label">Libellé de l'opération</span>
                  <span class="detail-val"><strong>{{ selectedTxDetail.libelle }}</strong></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">N° Facture / Pièce</span>
                  <span class="detail-val"><code>{{ selectedTxDetail.numeroFacture || '—' }}</code></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Montant</span>
                  <span class="detail-val">
                    <strong [ngClass]="selectedTxDetail.typeMouvement === 'ENTREE' ? 'text-success' : 'text-danger'">
                      {{ selectedTxDetail.typeMouvement === 'ENTREE' ? '+' : '-' }}{{ selectedTxDetail.montant | number }} FCFA
                    </strong>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Opérateur (enregistré par)</span>
                  <span class="detail-val"><strong>{{ selectedTxDetail.utilisateurNomComplet }}</strong></span>
                </div>
                @if (selectedTxDetail.siteNom) {
                  <div class="detail-item">
                    <span class="detail-label">Site</span>
                    <span class="detail-val">{{ selectedTxDetail.siteNom }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDetailModal = false">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL DÉTAIL NATURE D'OPÉRATION -->
      @if (showDetailNatureModal && selectedNatureDetail) {
        <div class="modal-backdrop">
          <div class="modal-content" style="max-width: 540px;">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Détail de la nature d'opération
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showDetailNatureModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Code</span>
                  <span class="detail-val"><code>{{ selectedNatureDetail.code }}</code></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Sens</span>
                  <span class="detail-val">
                    <span class="badge" [ngClass]="selectedNatureDetail.sens === 'ENTREE' ? 'badge-entree' : 'badge-sortie'">
                      {{ selectedNatureDetail.sens === 'ENTREE' ? 'RECETTE' : 'DÉPENSE' }}
                    </span>
                  </span>
                </div>
                <div class="detail-item full-width">
                  <span class="detail-label">Libellé</span>
                  <span class="detail-val"><strong>{{ selectedNatureDetail.libelle }}</strong></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Plan comptable</span>
                  <span class="detail-val">{{ selectedNatureDetail.planComptable || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Statut</span>
                  <span class="detail-val">
                    @if (selectedNatureDetail.actif) {
                      <span class="badge badge-solde">Active</span>
                    } @else {
                      <span class="badge badge-expire">Inactive</span>
                    }
                  </span>
                </div>
                <div class="detail-item full-width">
                  <span class="detail-label">Description</span>
                  <span class="detail-val" style="white-space: pre-wrap;">{{ selectedNatureDetail.description || 'Aucune description' }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDetailNatureModal = false">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL SUPPRESSION NATURE D'OPÉRATION -->
      @if (showDeleteNatureModal && targetNatureDelete) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Confirmation de Suppression
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showDeleteNatureModal = false">✕</button>
            </div>
            <div class="modal-body">
              <p>Supprimer définitivement la nature d'opération <strong>{{ targetNatureDelete.libelle }}</strong> (code : <code>{{ targetNatureDelete.code }}</code>) ?</p>
              <div class="form-help mt-2">Cette action est irréversible. Si des opérations y sont déjà rattachées, la suppression sera bloquée.</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteNatureModal = false">Annuler</button>
              <button type="button" class="btn btn-danger" [disabled]="deletingNature" (click)="confirmDeleteNature()">
                {{ deletingNature ? 'Suppression...' : 'Supprimer' }}
              </button>
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

    .site-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      /* Le filtre de site n'apparaît que pour un compte multi-site : nombre de colonnes
         variable, d'où un gabarit souple plutôt que des largeurs fixes par position. */
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
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

    .action-flex {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.1rem 1.5rem;
      padding: 0.5rem 0;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .detail-val {
      font-size: 0.95rem;
      color: var(--text-dark);
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
  siteFiltre: number | null = null;
  page = 0;
  totalPages = 0;
  totalElements = 0;

  sites: Site[] = [];
  naturesActives: NatureOperation[] = [];
  naturesToutes: NatureOperation[] = [];
  loadingNatures = false;
  natureRechercheFiltre = '';
  natureSensFiltre: 'ENTREE' | 'SORTIE' | '' = '';
  natureActifFiltre: boolean | null = null;

  get naturesFiltrees(): NatureOperation[] {
    return this.naturesToutes.filter(n => {
      if (this.natureSensFiltre && n.sens !== this.natureSensFiltre) return false;
      if (this.natureActifFiltre !== null && n.actif !== this.natureActifFiltre) return false;
      if (this.natureRechercheFiltre) {
        const q = this.natureRechercheFiltre.toLowerCase().trim();
        const code = (n.code || '').toLowerCase();
        const libelle = (n.libelle || '').toLowerCase();
        const plan = (n.planComptable || '').toLowerCase();
        if (!code.includes(q) && !libelle.includes(q) && !plan.includes(q)) return false;
      }
      return true;
    });
  }

  showNewTxModal = false;
  newTx: { natureOperationId: number | null; montant: number | null; libelle: string; numeroFacture: string; siteId: number | null } = {
    natureOperationId: null,
    montant: null,
    libelle: '',
    numeroFacture: '',
    siteId: null
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

  showDetailModal = false;
  selectedTxDetail: TransactionCaisse | null = null;

  showDetailNatureModal = false;
  selectedNatureDetail: NatureOperation | null = null;

  showDeleteNatureModal = false;
  targetNatureDelete: NatureOperation | null = null;
  deletingNature = false;

  constructor(private apiService: ApiService, private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadSites();
    this.loadRecap();
    this.loadTransactions();
    this.loadNaturesActives();
    this.loadNaturesToutes();
    // Ouvre directement le bon onglet quand on arrive depuis le sous-menu de la barre
    // latérale (?tab=...) ; s'abonne (plutôt qu'un simple snapshot) car Angular réutilise
    // cette même instance de composant en changeant seulement les query params.
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'operations' || params['tab'] === 'natures') {
        this.activeTab = params['tab'];
      }
    });
  }

  get canAdd(): boolean {
    return this.authService.hasPermission(['CAISSE_CREER']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  get selectedNature(): NatureOperation | null {
    return this.naturesActives.find(n => n.id === this.newTx.natureOperationId) || null;
  }

  /** Sites dont l'utilisateur courant peut consulter/gérer la caisse : limités à ses sites
   *  d'affectation pour une caissière, tous les sites (vision consolidée) pour ADMIN. */
  get sitesAutorises(): Site[] {
    const user = this.authService.currentUserValue;
    if (user?.role === 'CAISSIERE') {
      return this.sites.filter(s => user.siteIds?.includes(s.id));
    }
    return this.sites;
  }

  get siteNomFiltre(): string {
    return this.sites.find(s => s.id === this.siteFiltre)?.nom || '';
  }

  loadSites(): void {
    this.apiService.getSites(true).subscribe({
      next: (res) => this.sites = res,
      error: (err) => console.error(err)
    });
  }

  onSiteFiltreChange(): void {
    this.page = 0;
    this.loadRecap();
    this.loadTransactions();
  }

  /** Rafraîchit tout ce qui peut avoir changé sans passer par cet écran. */
  actualiser(): void {
    this.refreshing = true;
    let restants = 3;
    const termine = () => { if (--restants <= 0) this.refreshing = false; };
    this.apiService.getRecapCaisse(this.siteFiltre || undefined).subscribe({
      next: (r) => { this.recap = r; termine(); },
      error: (err) => { console.error(err); termine(); }
    });
    this.apiService.getTransactionsCaisse(this.typeFiltre, this.natureFiltreId || undefined, this.page, 15, this.siteFiltre || undefined).subscribe({
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
    this.apiService.getRecapCaisse(this.siteFiltre || undefined).subscribe({
      next: (r) => this.recap = r,
      error: (err) => console.error(err)
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.apiService.getTransactionsCaisse(this.typeFiltre, this.natureFiltreId || undefined, this.page, 15, this.siteFiltre || undefined).subscribe({
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
    this.siteFiltre = null;
    this.page = 0;
    this.loadRecap();
    this.loadTransactions();
  }

  // ============== OPÉRATIONS ==============

  openNewTxModal(): void {
    this.formError = '';
    const sitesAutorises = this.sitesAutorises;
    this.newTx = {
      natureOperationId: null,
      montant: null,
      libelle: '',
      numeroFacture: '',
      siteId: sitesAutorises.length === 1 ? sitesAutorises[0].id : this.siteFiltre
    };
    this.showNewTxModal = true;
  }

  onNatureChange(): void {
    this.formError = '';
  }

  isFormValide(): boolean {
    const siteRequis = this.sitesAutorises.length <= 1 || !!this.newTx.siteId;
    return !!this.newTx.natureOperationId && !!this.newTx.montant && this.newTx.montant > 0 && !!this.newTx.libelle && siteRequis;
  }

  saveTransaction(): void {
    if (!this.isFormValide()) return;

    this.saving = true;
    this.formError = '';

    this.apiService.enregistrerTransactionCaisse({
      natureOperationId: this.newTx.natureOperationId!,
      montant: this.newTx.montant!,
      siteId: this.newTx.siteId || undefined,
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

  openDetailModal(tx: TransactionCaisse): void {
    this.selectedTxDetail = tx;
    this.showDetailModal = true;
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
    const url = this.apiService.getCaissePdfUrl({
      type: this.typeFiltre || undefined,
      natureOperationId: this.natureFiltreId || undefined,
      siteId: this.siteFiltre || undefined
    });
    this.apiService.downloadBlob(url, 'journal_caisse.pdf');
  }

  imprimerJournal(): void {
    const url = this.apiService.getCaissePdfUrl({
      type: this.typeFiltre || undefined,
      natureOperationId: this.natureFiltreId || undefined,
      siteId: this.siteFiltre || undefined
    });
    this.apiService.printBlob(url);
  }

  exportExcel(): void {
    const url = this.apiService.getCaisseExcelUrl({
      type: this.typeFiltre || undefined,
      natureOperationId: this.natureFiltreId || undefined,
      siteId: this.siteFiltre || undefined
    });
    this.apiService.downloadBlob(url, 'journal_caisse.xlsx');
  }

  exportNaturesPdf(): void {
    const url = this.apiService.getNaturesCaissePdfUrl(
      this.natureSensFiltre || undefined,
      this.natureActifFiltre ?? undefined,
      this.natureRechercheFiltre || undefined
    );
    this.apiService.downloadBlob(url, 'natures_operation.pdf');
  }

  imprimerNatures(): void {
    const url = this.apiService.getNaturesCaissePdfUrl(
      this.natureSensFiltre || undefined,
      this.natureActifFiltre ?? undefined,
      this.natureRechercheFiltre || undefined
    );
    this.apiService.printBlob(url);
  }

  exportNaturesExcel(): void {
    const url = this.apiService.getNaturesCaisseExcelUrl(
      this.natureSensFiltre || undefined,
      this.natureActifFiltre ?? undefined,
      this.natureRechercheFiltre || undefined
    );
    this.apiService.downloadBlob(url, 'natures_operation.xlsx');
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

  openDetailNatureModal(n: NatureOperation): void {
    this.selectedNatureDetail = n;
    this.showDetailNatureModal = true;
  }

  openDeleteNatureModal(n: NatureOperation): void {
    this.targetNatureDelete = n;
    this.showDeleteNatureModal = true;
  }

  confirmDeleteNature(): void {
    if (!this.targetNatureDelete) return;
    this.deletingNature = true;
    this.apiService.deleteNatureOperation(this.targetNatureDelete.id).subscribe({
      next: () => {
        this.deletingNature = false;
        this.showDeleteNatureModal = false;
        this.loadNaturesToutes();
        this.loadNaturesActives();
      },
      error: (err) => {
        this.deletingNature = false;
        alert(extraireMessageErreur(err, 'Erreur lors de la suppression de la nature d\'opération.'));
      }
    });
  }
}
