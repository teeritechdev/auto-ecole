import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, PassageExamen, SessionExamen, Site } from '../../core/models/models';
import { forkJoin } from 'rxjs';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-examens',
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="examens-page">
      <!-- HEADER -->
      <div class="page-header-bar">
        <div>
          <h2>Suivi Pédagogique & Examens</h2>
          <p>Épreuves de Code, Créneau et Circulation</p>
        </div>
        <div class="header-buttons">
          <button class="btn btn-outline btn-sm" (click)="exporterPdf()" title="Exporter en PDF">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Export PDF
          </button>
          <button class="btn btn-outline btn-sm" (click)="imprimerListe()" title="Imprimer la liste">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimer
          </button>
          <button class="btn btn-outline btn-sm" (click)="exporterExcel()" title="Exporter en Excel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Export Excel
          </button>
          @if (canAdd) {
            <button class="btn btn-primary" (click)="openProgrammerModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Créer un Examen
            </button>
          }
        </div>
      </div>

      <!-- FILTRE -->
      <div class="card filter-card">
        <div class="filter-row">
          @if (!isMoniteurRole || sitesAutorises.length > 1) {
            <div class="filter-col">
              <select class="form-control" [(ngModel)]="sessionFiltreSite">
                <option value="">Tous les sites</option>
                @for (s of sitesAutorises; track s.id) {
                  <option [value]="s.id">{{ s.nom }}</option>
                }
              </select>
            </div>
          }
          <div class="filter-col">
            <select class="form-control" [(ngModel)]="sessionFiltreEpreuve">
              @if (epreuvesAutorisees.length > 1) {
                <option value="">Toutes les épreuves</option>
              }
              @for (t of epreuvesAutorisees; track t) {
                <option [value]="t">{{ epreuveLabel(t) }}</option>
              }
              @if (epreuvesAutorisees.length === 0) {
                <option value="" disabled>Aucune spécialité assignée</option>
              }
            </select>
          </div>
          <div class="filter-col">
            <select class="form-control" [(ngModel)]="sessionFiltreStatut">
              <option value="">Tous les statuts</option>
              <option value="PROGRAMME">Programmé</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>
          <div class="filter-action">
            <button class="btn btn-secondary" (click)="reinitialiserFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>

      <!-- SESSIONS D'EXAMEN -->
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 25%;">Lieu</th>
                <th style="width: 18%;">Épreuve</th>
                <th style="width: 14%;">Inscrits</th>
                <th style="width: 14%;">Statut</th>
                <th class="text-right" style="width: 14%;">Action</th>
              </tr>
            </thead>
            <tbody>
              @if (loadingSessions) {
                <tr>
                  <td colspan="6" class="text-center py-4">Chargement des sessions d'examens...</td>
                </tr>
              }
              @if (!loadingSessions && sessionsAffichees.length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-4">Aucune session d'examen trouvée.</td>
                </tr>
              }
              @for (s of sessionsAffichees; track s.id) {
                <tr>
                  <td><strong>{{ s.datePassage | date:'dd/MM/yyyy' }}</strong></td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{{ s.lieu || s.siteNom || 'Non spécifié' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-programme': s.typeEpreuve === 'CODE',
                      'badge-solde': s.typeEpreuve === 'CRENEAU',
                      'badge-en-cours': s.typeEpreuve === 'CIRCULATION'
                    }">{{ epreuveLabel(s.typeEpreuve) }}</span>
                  </td>
                  <td>
                    <span class="badge" style="background:#eef4ff; color:#103778; font-weight:600;">
                      {{ s.candidats.length }} candidat(s)
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-reussi': (s.statut || (s.terminee ? 'TERMINE' : 'PROGRAMME')) === 'TERMINE',
                      'badge-warning': (s.statut || (s.terminee ? 'TERMINE' : 'PROGRAMME')) === 'EN_COURS',
                      'badge-programme': (s.statut || (s.terminee ? 'TERMINE' : 'PROGRAMME')) === 'PROGRAMME'
                    }">
                      {{ formatStatut(s.statut || (s.terminee ? 'TERMINE' : (s.datePassee ? 'EN_COURS' : 'PROGRAMME'))) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-flex" style="justify-content: flex-end; gap: 0.35rem;">
                      <!-- VOIR -->
                      <button class="btn btn-outline btn-xs" (click)="openSessionDetail(s.id)" title="Voir le détail et les résultats">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <!-- AFFECTER CANDIDATS -->
                      @if (peutModifierSession(s)) {
                        <button class="btn btn-primary btn-xs" (click)="openQuickAffecterModal(s)" title="Affecter des candidats">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        </button>
                      }
                      <!-- MODIFIER -->
                      @if (peutModifierSession(s)) {
                        <button class="btn btn-secondary btn-xs" (click)="openEditSessionModal(s)" title="Modifier la session">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                      }
                      <!-- SUPPRIMER -->
                      @if (peutSupprimerSession(s)) {
                        <button class="btn btn-danger btn-xs" (click)="supprimerSession(s)" title="Supprimer la session">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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

      <!-- MODAL DÉTAIL SESSION -->
      @if (showSessionModal && sessionDetail) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3>Session du {{ sessionDetail.datePassage | date:'dd/MM/yyyy' }} — {{ epreuveLabel(sessionDetail.typeEpreuve) }}</h3>
              <button class="btn btn-outline btn-sm" (click)="closeSessionModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (sessionError) {
                <div class="alert alert-danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {{ sessionError }}
                </div>
              }
              @if (estTerminee(sessionDetail)) {
                <div class="alert alert-success" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span><strong>Session terminée</strong> — Les résultats sont proclamés. Seules la consultation et la suppression sont autorisées.</span>
                </div>
              }
              <div class="alert alert-info session-info">
                <div class="session-info-text">
                  <div>Lieu : <strong>{{ sessionDetail.lieu || sessionDetail.siteNom || 'Non spécifié' }}</strong></div>
                  <div>
                    Moniteur : <strong>{{ sessionDetail.moniteurNomComplet || 'Non affecté' }}</strong>
                    @if (sessionDetail.moniteurSpecialites?.length) {
                      <span class="sub-text"> ({{ formatSpecialites(sessionDetail.moniteurSpecialites) }})</span>
                    }
                  </div>
                  <div>{{ sessionDetail.datePassee ? 'Date passée' : 'À venir' }}</div>
                </div>
                @if (peutModifierSession(sessionDetail)) {
                  @if (!editingSessionDate) {
                    <button class="btn btn-outline btn-sm" (click)="startEditSessionDate()">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                      Modifier la date
                    </button>
                  } @else {
                    <div class="edit-date-row">
                      <input type="date" class="form-control" [(ngModel)]="editSessionDateValue" name="editSessionDate" />
                      <button class="btn btn-secondary btn-sm" [disabled]="savingSessionDate" (click)="editingSessionDate = false">Annuler</button>
                      <button class="btn btn-primary btn-sm" [disabled]="savingSessionDate" (click)="saveSessionDate()">
                        {{ savingSessionDate ? '...' : 'Enregistrer' }}
                      </button>
                    </div>
                  }
                }
              </div>

              @if (hasModificationsResultats) {
                <div class="alert alert-warning" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem; border-left: 4px solid #f59e0b;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span><strong>{{ getNbModificationsResultats() }} résultat(s) modifié(s) en attente</strong> d'enregistrement pour cette session.</span>
                  </div>
                  <div style="display:flex; gap:0.5rem;">
                    <button type="button" class="btn btn-secondary btn-sm" [disabled]="savingResultats" (click)="annulerModificationsResultats()">
                      Annuler
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" [disabled]="savingResultats" (click)="enregistrerModificationsResultats()">
                      @if (savingResultats) { Enregistrement... } @else { Enregistrer les résultats }
                    </button>
                  </div>
                </div>
              }

              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Inscrit</th>
                    <th>Résultat actuel</th>
                    <th>Tentatives</th>
                    @if (peutNoter(sessionDetail)) {
                      <th style="text-align: center; min-width: 190px;">Notation rapide</th>
                    }
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (sessionDetail.candidats.length === 0) {
                    <tr><td [attr.colspan]="peutNoter(sessionDetail) ? 5 : 4" class="text-center py-4">Aucun inscrit dans cette session.</td></tr>
                  }
                  @for (p of sessionDetail.candidats; track p.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/candidats', p.candidatId]" class="candidat-link"><strong>{{ p.candidatNomComplet }}</strong></a>
                        <div class="sub-text">{{ p.candidatNumeroDossier }}</div>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getBadgeClass(getResultatAffiche(p))">{{ getResultatAffiche(p) }}</span>
                        @if (isResultatModifie(p)) {
                          <span class="badge-modifie" title="Modifié (en attente d'enregistrement)">Modifié</span>
                        }
                      </td>
                      <td>{{ p.nombreEchecs }}/5</td>

                      @if (peutNoter(sessionDetail)) {
                        <td style="text-align: center;">
                          <div class="notation-cases">
                            <!-- CASE VALIDER -->
                            <button type="button" 
                                    class="btn-case btn-case-valider"
                                    [class.selected]="getResultatAffiche(p) === 'REUSSI'"
                                    [disabled]="savingResultats"
                                    (click)="proposerResultat(p, 'REUSSI')"
                                    title="Marquer comme Validé / Réussi">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              <span>Validé</span>
                            </button>

                            <!-- CASE ÉCHOUÉ -->
                            <button type="button" 
                                    class="btn-case btn-case-ajourner"
                                    [class.selected]="getResultatAffiche(p) === 'AJOURNE'"
                                    [disabled]="savingResultats"
                                    (click)="proposerResultat(p, 'AJOURNE')"
                                    title="Marquer comme Échoué / Ajourné">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              <span>Échoué</span>
                            </button>
                          </div>
                        </td>
                      }

                      <td class="text-right">
                        <div class="action-flex">
                          @if (peutNoter(sessionDetail)) {
                            <button class="btn btn-outline btn-xs" (click)="openUpdateModal(p)" title="Modifier avec observations">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                            </button>
                          }
                          @if (peutRetirer(sessionDetail)) {
                            <button class="btn btn-danger btn-xs" (click)="retirerDeSession(p.id)" title="Retirer de la session">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              @if (hasModificationsResultats) {
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-color);">
                  <button type="button" class="btn btn-secondary btn-sm" [disabled]="savingResultats" (click)="annulerModificationsResultats()">
                    Annuler
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" [disabled]="savingResultats" (click)="enregistrerModificationsResultats()">
                    @if (savingResultats) { Enregistrement... } @else { Enregistrer les résultats }
                  </button>
                </div>
              }

              @if (peutModifierSession(sessionDetail)) {
                <div style="margin-top: 1.25rem;">
                  @if (!showAjoutCandidats) {
                    <button class="btn btn-secondary btn-sm" (click)="openAjoutCandidats()">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      Ajouter des inscrits
                    </button>
                  } @else {
                    <div class="form-group">
                      @if (sitesAutorises.length > 1) {
                        <div style="margin-bottom: 0.75rem;">
                          <label class="form-label">Filtrer les inscrits par site :</label>
                          <select class="form-control" [(ngModel)]="ajoutFilterSiteId" (change)="onAjoutFilterSiteChange()">
                            <option value="">Tous mes sites</option>
                            @for (s of sitesAutorises; track s.id) {
                              <option [value]="s.id">{{ s.nom }}</option>
                            }
                          </select>
                        </div>
                      }
                      <label class="form-label">Inscrits éligibles pour cette épreuve</label>
                      <div class="candidats-list">
                        @for (c of candidatsAjoutablesFiltres; track c.id) {
                          <label class="candidat-option">
                            <input type="checkbox" [checked]="isAjoutSelected(c.id)" (change)="toggleAjoutCandidat(c.id)" />
                            <span class="candidat-option-text">
                              <strong>{{ c.numeroDossier }}</strong>
                              <span>{{ c.nom }} {{ c.prenom }} ({{ c.categoriePermisCode }}) - {{ c.siteNom }}</span>
                            </span>
                          </label>
                        }
                        @if (candidatsAjoutablesFiltres.length === 0) {
                          <div class="form-help" style="padding: 1rem; text-align: center;">
                            Aucun inscrit éligible disponible pour cette épreuve.
                          </div>
                        }
                      </div>
                      @if (ajoutSelectionIds.length > 0) {
                        <div class="selection-count">
                          {{ ajoutSelectionIds.length }} inscrit(s) sélectionné(s)
                        </div>
                      }
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                      <button class="btn btn-secondary btn-sm" (click)="showAjoutCandidats = false">Annuler</button>
                      <button class="btn btn-primary btn-sm" [disabled]="ajoutSelectionIds.length === 0 || savingAjout" (click)="confirmerAjout()">
                        {{ savingAjout ? 'Enregistrement...' : 'Confirmer l\'ajout (' + ajoutSelectionIds.length + ')' }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeSessionModal()">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL PROGRAMMER EXAMEN -->
      @if (showProgrammerModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
                Programmer une Session d'Examen
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showProgrammerModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveProgrammer()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ formError }}
                  </div>
                }

                <!-- Ordre des champs conforme (Proposition A) : 1. Type d'épreuve, 2. Date, 3. Lieu, 4. Statut -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Type d'épreuve <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newPassage.typeEpreuve" name="typeEpreuve" required>
                      @for (t of epreuvesAutorisees; track t) {
                        <option [value]="t">{{ epreuveLabel(t) }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date de la session <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="newPassage.datePassage" name="datePassage" required />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Lieu <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="newPassage.lieu" name="lieu" placeholder="Ex: Centre Ouaga 2000, Piste Song-Naba..." required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Statut</label>
                    <select class="form-control" [(ngModel)]="newPassage.statut" name="statut">
                      <option value="PROGRAMME">Programmé (Par défaut)</option>
                      <option value="EN_COURS">En cours (Date du jour)</option>
                      <option value="TERMINE">Terminé (Résultats affectés)</option>
                    </select>
                  </div>
                </div>

                <div class="alert alert-info" style="font-size: 0.85rem; margin-bottom: 1rem;">
                  ℹ️ <em>La session sera créée d'abord. Vous pourrez affecter les candidats à tout moment via l'icône dédiée 👤➕.</em>
                </div>

                <div class="form-group">
                  <label class="form-label">Observations</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="newPassage.observations" name="observations" placeholder="Remarques éventuelles..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showProgrammerModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving || !newPassage.datePassage || !newPassage.lieu || !newPassage.typeEpreuve">
                  @if (saving) { Enregistrement... } @else { Créer la Session }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL AFFECTER DES CANDIDATS (ACTION RAPIDE 👤➕) -->
      @if (showQuickAffecterModal && quickTargetSession) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Affecter des candidats — Session {{ epreuveLabel(quickTargetSession.typeEpreuve) }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showQuickAffecterModal = false">✕</button>
            </div>
            <div class="modal-body">
              @if (quickAffecterError) {
                <div class="alert alert-danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {{ quickAffecterError }}
                </div>
              }
              <div class="alert alert-info">
                Lieu : <strong>{{ quickTargetSession.lieu || quickTargetSession.siteNom || 'Non spécifié' }}</strong> | 
                Date : <strong>{{ quickTargetSession.datePassage | date:'dd/MM/yyyy' }}</strong> |
                Inscrits : <strong>{{ quickTargetSession.candidats.length }} candidat(s)</strong>
              </div>

              <!-- FILTRE PAR SITE POUR L'UTILISATEUR GÉRANT PLUSIEURS SITES -->
              @if (sitesAutorises.length > 1) {
                <div class="form-group" style="margin-bottom: 0.85rem;">
                  <label class="form-label" style="font-weight: 600;">Filtrer les inscrits par site :</label>
                  <select class="form-control" [(ngModel)]="quickFilterSiteId" (change)="onQuickFilterSiteChange()">
                    <option value="">Tous mes sites</option>
                    @for (site of sitesAutorises; track site.id) {
                      <option [value]="site.id">{{ site.nom }}</option>
                    }
                  </select>
                </div>
              }

              <div class="form-group">
                <label class="form-label">
                  Sélectionner les inscrits éligibles pour cette épreuve :
                </label>
                <div class="candidats-list" style="max-height: 220px;">
                  @for (c of quickEligibleCandidatsFiltres; track c.id) {
                    <label class="candidat-option">
                      <input type="checkbox" [checked]="isQuickSelected(c.id)" (change)="toggleQuickCandidat(c.id)" />
                      <span class="candidat-option-text">
                        <strong>{{ c.numeroDossier }}</strong>
                        <span>{{ c.nom }} {{ c.prenom }} ({{ c.categoriePermisCode }}) - {{ c.siteNom }}</span>
                      </span>
                    </label>
                  }
                  @if (quickEligibleCandidatsFiltres.length === 0) {
                    <div class="form-help" style="padding: 1rem; text-align: center;">
                      Aucun inscrit éligible disponible pour cette épreuve.
                    </div>
                  }
                </div>
                @if (quickSelectionIds.length > 0) {
                  <div class="selection-count">
                    {{ quickSelectionIds.length }} candidat(s) sélectionné(s)
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showQuickAffecterModal = false">Fermer</button>
              <button type="button" class="btn btn-primary" [disabled]="quickSelectionIds.length === 0 || savingQuickAffecter" (click)="confirmerQuickAffecter()">
                {{ savingQuickAffecter ? 'Affectation...' : 'Affecter (' + quickSelectionIds.length + ') candidat(s)' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL MODIFIER SESSION ✏️ -->
      @if (showEditSessionModal && editTargetSession) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Modifier la Session d'Examen
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showEditSessionModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveEditSession()">
              <div class="modal-body">
                @if (editSessionError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ editSessionError }}
                  </div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Date de la session <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="editSessionForm.datePassage" name="datePassage" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Lieu <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="editSessionForm.lieu" name="lieu" placeholder="Ex: Centre Ouaga 2000, Piste Song-Naba..." required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Observations</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="editSessionForm.observations" name="observations" placeholder="Remarques éventuelles..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showEditSessionModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="savingEditSession || !editSessionForm.datePassage || !editSessionForm.lieu">
                  {{ savingEditSession ? 'Enregistrement...' : 'Mettre à jour' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    
      <!-- MODAL MAJ RÉSULTAT -->
      @if (showUpdateModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Saisir / Mettre à jour le Résultat
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showUpdateModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveUpdateResultat()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ formError }}
                  </div>
                }
                <div class="alert alert-info">
                  Inscrit : <strong>{{ targetPassage?.candidatNomComplet }}</strong><br>
                  Épreuve : <strong>{{ targetPassage?.typeEpreuve }}</strong> ({{ targetPassage?.nombreEchecs }}/5 tentative(s))
                </div>
                <div class="form-group">
                  <label class="form-label">Date de passage réelle <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="updateData.datePassage" name="datePassage" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Résultat d'examen <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="updateData.resultat" name="resultat" required>
                    <option value="PROGRAMME">PROGRAMMÉ</option>
                    <option value="REUSSI">RÉUSSI (Admis)</option>
                    <option value="AJOURNE">AJOURNÉ</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Observations & Commentaires pédagogiques</label>
                  <textarea class="form-control" rows="3" [(ngModel)]="updateData.observations" name="observations" placeholder="Points forts, fautes éliminatoires..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showUpdateModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  @if (saving) { Mise à jour... } @else { Enregistrer la Décision }
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

    .page-header-bar h2 {
      color: var(--primary);
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .session-info {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .session-info-text {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .edit-date-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .edit-date-row .form-control {
      width: auto;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: nowrap;
    }

    .filter-col {
      flex: 1 1 0;
      min-width: 0;
    }

    .filter-col .form-control {
      width: 100%;
    }

    .filter-action {
      flex: 0 0 auto;
    }

    .filter-action .btn {
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .filter-row {
        flex-wrap: wrap;
      }
      .filter-col {
        flex: 1 1 calc(50% - 0.5rem);
        min-width: 140px;
      }
      .filter-action {
        flex: 1 1 100%;
        display: flex;
        justify-content: flex-end;
      }
    }

    .candidat-link {
      color: var(--text-main);
      font-weight: 600;
    }
    .candidat-link:hover { color: var(--primary); }

    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .obs-text {
      font-size: 0.8rem;
      color: #475569;
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

    .step-indicator {
      margin-bottom: 1.25rem;
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 700;
    }

    .form-help {
      margin-top: 0.35rem;
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .candidats-list {
      max-height: 13rem;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background: #fff;
    }

    .candidat-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
    }

    .candidat-option:last-child {
      border-bottom: 0;
    }

    .candidat-option:hover {
      background: #f8fafc;
    }

    .candidat-option input {
      width: 1.1rem;
      height: 1.1rem;
      flex: 0 0 auto;
      accent-color: var(--primary);
    }

    .candidat-option-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      font-size: 0.85rem;
    }

    .selection-count {
      margin-top: 0.6rem;
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .notation-cases {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      white-space: nowrap;
    }

    .btn-case {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      border: 1.5px solid transparent;
      cursor: pointer;
      background: #ffffff;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }

    .btn-case-valider {
      color: #15803d;
      border-color: #86efac;
      background: #f0fdf4;
    }
    .btn-case-valider:hover:not(:disabled) {
      background: #dcfce7;
      border-color: #22c55e;
      transform: translateY(-1px);
    }
    .btn-case-valider.selected {
      background: #16a34a;
      color: #ffffff;
      border-color: #15803d;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
    }

    .btn-case-ajourner {
      color: #b91c1c;
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .btn-case-ajourner:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #ef4444;
      transform: translateY(-1px);
    }
    .btn-case-ajourner.selected {
      background: #dc2626;
      color: #ffffff;
      border-color: #b91c1c;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
    }

    .btn-case:disabled {
      opacity: 0.6;
      cursor: wait;
      transform: none !important;
    }

    .badge-modifie {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
      margin-left: 0.35rem;
      font-weight: 600;
      vertical-align: middle;
    }
  `]
})
export class ExamensComponent implements OnInit {
  allCandidats: Candidat[] = [];
  eligibleCandidats: Candidat[] = [];
  allExamens: PassageExamen[] = [];
  saving = false;

  resultatsEnAttente: { [passageId: number]: 'REUSSI' | 'AJOURNE' } = {};
  savingResultats = false;

  sessions: SessionExamen[] = [];
  loadingSessions = false;
  sessionFiltreEpreuve = '';
  sessionFiltreSite = '';
  sessionFiltreStatut = '';
  sites: Site[] = [];

  showSessionModal = false;
  sessionDetail: SessionExamen | null = null;
  sessionError = '';
  showAjoutCandidats = false;
  candidatsAjoutables: Candidat[] = [];
  ajoutSelectionIds: number[] = [];
  savingAjout = false;

  showProgrammerModal = false;
  programmerStepIndex = 0;
  selectedCandidatIds: number[] = [];
  newPassage: any = {
    typeEpreuve: 'CODE',
    siteId: null,
    datePassage: new Date().toISOString().substring(0, 10),
    resultat: 'PROGRAMME',
    observations: ''
  };

  showUpdateModal = false;
  targetPassage: PassageExamen | null = null;
  notingPassageId: number | null = null;
  updateData: any = {
    datePassage: '',
    resultat: '',
    observations: ''
  };

  formError = '';

  editingSessionDate = false;
  editSessionDateValue = '';
  savingSessionDate = false;

  // Modals : Affectation Rapide & Modification Session
  showQuickAffecterModal = false;
  quickTargetSession: SessionExamen | null = null;
  quickEligibleCandidats: Candidat[] = [];
  quickFilterSiteId = '';
  quickSelectionIds: number[] = [];
  savingQuickAffecter = false;
  quickAffecterError = '';

  ajoutFilterSiteId = '';

  showEditSessionModal = false;
  editTargetSession: SessionExamen | null = null;
  editSessionForm: { datePassage: string; lieu: string; siteId: number | null; observations: string } = {
    datePassage: '',
    lieu: '',
    siteId: null,
    observations: ''
  };
  savingEditSession = false;
  editSessionError = '';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadSessions();
    this.loadCandidats();
    this.apiService.getSites(true).subscribe({
      next: (data) => this.sites = data,
      error: () => this.sites = []
    });
  }

  get isMoniteurRole(): boolean {
    return this.authService.currentUserValue?.role === 'MONITEUR';
  }

  getSessionStatut(s: SessionExamen): string {
    return s.statut || (s.terminee ? 'TERMINE' : (s.datePassee ? 'EN_COURS' : 'PROGRAMME'));
  }

  get sessionsAffichees(): SessionExamen[] {
    return this.sessions
      .filter(s => !this.sessionFiltreEpreuve || s.typeEpreuve === this.sessionFiltreEpreuve)
      .filter(s => !this.sessionFiltreSite || String(s.siteId) === this.sessionFiltreSite)
      .filter(s => !this.sessionFiltreStatut || this.getSessionStatut(s) === this.sessionFiltreStatut);
  }

  reinitialiserFiltres(): void {
    this.sessionFiltreEpreuve = '';
    this.sessionFiltreSite = '';
    this.sessionFiltreStatut = '';
  }

  exporterPdf(): void {
    this.apiService.downloadBlob(
      this.apiService.getSessionsPdfUrl(this.sessionFiltreSite, this.sessionFiltreEpreuve, this.sessionFiltreStatut),
      'sessions_examens.pdf'
    );
  }

  imprimerListe(): void {
    this.apiService.printBlob(
      this.apiService.getSessionsPdfUrl(this.sessionFiltreSite, this.sessionFiltreEpreuve, this.sessionFiltreStatut)
    );
  }

  exporterExcel(): void {
    this.apiService.downloadBlob(
      this.apiService.getSessionsExcelUrl(this.sessionFiltreSite, this.sessionFiltreEpreuve, this.sessionFiltreStatut),
      'sessions_examens.xlsx'
    );
  }

  loadSessions(): void {
    this.loadingSessions = true;
    this.apiService.getSessions().subscribe({
      next: (data) => {
        this.sessions = data;
        this.loadingSessions = false;
      },
      error: () => {
        this.loadingSessions = false;
      }
    });
  }

  openSessionDetail(id: number): void {
    this.sessionError = '';
    this.showAjoutCandidats = false;
    this.resultatsEnAttente = {};
    this.apiService.getSessionDetail(id).subscribe({
      next: (data) => {
        this.sessionDetail = data;
        this.showSessionModal = true;
      },
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors du chargement de la session.'))
    });
  }

  closeSessionModal(): void {
    if (this.hasModificationsResultats) {
      if (!confirm('Des modifications de résultats ne sont pas encore enregistrées. Voulez-vous vraiment fermer sans enregistrer ?')) {
        return;
      }
    }
    this.showSessionModal = false;
    this.sessionDetail = null;
    this.showAjoutCandidats = false;
    this.resultatsEnAttente = {};
  }

  estTerminee(s?: SessionExamen | null): boolean {
    if (!s) return false;
    if (s.statut === 'TERMINE' || s.terminee) return true;
    return !!(s.candidats && s.candidats.length > 0 && s.candidats.every(p => p.resultat !== 'PROGRAMME'));
  }

  peutModifierSession(s?: SessionExamen | null): boolean {
    if (!s || this.estTerminee(s)) return false;
    return this.isAdmin || !s.datePassee;
  }

  peutSupprimerSession(s?: SessionExamen | null): boolean {
    if (!s) return false;
    return this.isAdmin || !s.datePassee || this.estTerminee(s);
  }

  /** Le retrait n'est possible que si la session n'est pas terminée, et avant la date pour un moniteur ; sans restriction pour l'admin. */
  peutRetirer(s: SessionExamen): boolean {
    return !this.estTerminee(s) && (this.isAdmin || !s.datePassee);
  }

  /** Noter un résultat n'a de sens qu'une fois la date de l'examen arrivée, et tant que la session n'est pas verrouillée/terminée. */
  peutNoter(s: SessionExamen): boolean {
    return !this.estTerminee(s) && s.datePassee;
  }

  retirerDeSession(passageId: number): void {
    if (!this.sessionDetail) return;
    if (!confirm('Retirer ce candidat de la session ?')) return;
    const sessionId = this.sessionDetail.id;
    this.apiService.retirerCandidatDeSession(sessionId, passageId).subscribe({
      next: () => {
        this.openSessionDetail(sessionId);
        this.loadSessions();
      },
      error: (err) => {
        this.sessionError = extraireMessageErreur(err, 'Erreur lors du retrait.');
      }
    });
  }

  openAjoutCandidats(): void {
    if (!this.sessionDetail) return;
    this.ajoutSelectionIds = [];
    this.ajoutFilterSiteId = '';
    const idsExistants = new Set(this.sessionDetail.candidats.map(p => p.candidatId));
    this.candidatsAjoutables = this.allCandidats.filter(c =>
      !idsExistants.has(c.id) && this.estEligiblePour(c, this.sessionDetail!.typeEpreuve, null)
    );
    this.showAjoutCandidats = true;
  }

  get candidatsAjoutablesFiltres(): Candidat[] {
    if (!this.ajoutFilterSiteId) {
      return this.candidatsAjoutables;
    }
    return this.candidatsAjoutables.filter(c => String(c.siteId) === this.ajoutFilterSiteId);
  }

  onAjoutFilterSiteChange(): void {
    // Filtrage réactif via le getter candidatsAjoutablesFiltres
  }

  isAjoutSelected(candidatId: number): boolean {
    return this.ajoutSelectionIds.includes(candidatId);
  }

  toggleAjoutCandidat(candidatId: number): void {
    this.ajoutSelectionIds = this.isAjoutSelected(candidatId)
      ? this.ajoutSelectionIds.filter(id => id !== candidatId)
      : [...this.ajoutSelectionIds, candidatId];
  }

  confirmerAjout(): void {
    if (!this.sessionDetail || this.ajoutSelectionIds.length === 0) return;
    const sessionId = this.sessionDetail.id;
    this.savingAjout = true;
    this.sessionError = '';
    this.apiService.ajouterCandidatsASession(sessionId, this.ajoutSelectionIds).subscribe({
      next: () => {
        this.savingAjout = false;
        this.showAjoutCandidats = false;
        this.openSessionDetail(sessionId);
        this.loadSessions();
      },
      error: (err) => {
        this.savingAjout = false;
        this.sessionError = extraireMessageErreur(err, "Erreur lors de l'ajout.");
      }
    });
  }

  /** Modifier la date de la session suit la même règle de gestion que le retrait
   *  (admin sans restriction, moniteur limité à une date non passée). */
  peutGererSession(s: SessionExamen): boolean {
    return this.peutRetirer(s);
  }

  startEditSessionDate(): void {
    if (!this.sessionDetail) return;
    this.editSessionDateValue = this.sessionDetail.datePassage;
    this.editingSessionDate = true;
  }

  saveSessionDate(): void {
    if (!this.sessionDetail || !this.editSessionDateValue) return;
    const sessionId = this.sessionDetail.id;
    this.savingSessionDate = true;
    this.sessionError = '';
    this.apiService.modifierDateSession(sessionId, this.editSessionDateValue).subscribe({
      next: () => {
        this.savingSessionDate = false;
        this.editingSessionDate = false;
        this.openSessionDetail(sessionId);
        this.loadSessions();
      },
      error: (err) => {
        this.savingSessionDate = false;
        this.sessionError = extraireMessageErreur(err, 'Erreur lors de la modification de la date.');
      }
    });
  }

  formatSpecialites(specialites?: string[]): string {
    return (specialites || []).map(s => this.epreuveLabel(s)).join(', ');
  }

  private readonly EPREUVE_LABELS: Record<string, string> = {
    CODE: '1. Code de la route',
    CRENEAU: '2. Manœuvre / Créneau',
    CIRCULATION: '3. Conduite en circulation'
  };

  epreuveLabel(t: string): string {
    return this.EPREUVE_LABELS[t] || t;
  }

  /** Types d'épreuves que l'utilisateur courant peut consulter/programmer :
   *  non restreint pour ADMIN/SECRETAIRE, limité à sa spécialité pour un MONITEUR
   *  (aucune spécialité assignée => aucune épreuve accessible). */
  get epreuvesAutorisees(): string[] {
    const user = this.authService.currentUserValue;
    if (user?.role === 'MONITEUR') {
      return user.specialites || [];
    }
    return ['CODE', 'CRENEAU', 'CIRCULATION'];
  }

  /** Sites sur lesquels l'utilisateur courant peut consulter/programmer : limités à ses
   *  sites d'affectation pour un moniteur ou une secrétaire, tous les sites pour ADMIN. */
  get sitesAutorises(): Site[] {
    const user = this.authService.currentUserValue;
    if (user?.role === 'MONITEUR' || user?.role === 'SECRETAIRE') {
      return this.sites.filter(s => user.siteIds?.includes(s.id));
    }
    return this.sites;
  }

  get canAdd(): boolean {
    const user = this.authService.currentUserValue;
    if (user?.role === 'ADMIN') {
      return true;
    }
    return user?.role === 'MONITEUR' && this.epreuvesAutorisees.length > 0;
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  loadCandidats(): void {
    forkJoin({
      candidats: this.apiService.getCandidats('', '', undefined, 0, 200),
      examens: this.apiService.getPassages(undefined, '', '', 0, 1000)
    }).subscribe({
      next: ({ candidats, examens }) => {
        this.allCandidats = candidats.content || [];
        this.allExamens = examens.content || [];
        this.updateEligibleCandidats();
      },
      error: (err) => {
        console.error(err);
        this.allCandidats = [];
        this.eligibleCandidats = [];
      }
    });
  }

  /** Étapes du magicien de programmation, dans l'ordre : le site n'est demandé que si le
   *  moniteur en a plusieurs, l'épreuve que s'il a plusieurs spécialités, la dernière étape
   *  (candidats/date/résultat) est toujours présente. */
  get wizardSteps(): ('site' | 'epreuve' | 'final')[] {
    const steps: ('site' | 'epreuve' | 'final')[] = [];
    if (this.sitesAutorises.length > 1) steps.push('site');
    if (this.epreuvesAutorisees.length > 1) steps.push('epreuve');
    steps.push('final');
    return steps;
  }

  get currentWizardStep(): 'site' | 'epreuve' | 'final' {
    return this.wizardSteps[this.programmerStepIndex] ?? 'final';
  }

  openProgrammerModal(): void {
    this.formError = '';
    this.selectedCandidatIds = [];
    this.newPassage = {
      typeEpreuve: this.epreuvesAutorisees[0] || 'CODE',
      siteId: this.sitesAutorises.length === 1 ? this.sitesAutorises[0].id : null,
      datePassage: new Date().toISOString().substring(0, 10),
      resultat: 'PROGRAMME',
      observations: ''
    };
    this.programmerStepIndex = 0;
    this.updateEligibleCandidats();
    this.showProgrammerModal = true;
  }

  onTypeEpreuveChange(): void {
    this.selectedCandidatIds = [];
    this.updateEligibleCandidats();
  }

  onSiteChange(): void {
    this.selectedCandidatIds = [];
    this.updateEligibleCandidats();
  }

  /** L'étape de parcours (champ stocké, mis à jour par le backend à chaque transition)
   *  fait foi à elle seule : un candidat n'est éligible pour une épreuve que s'il s'y
   *  trouve exactement (ni pas encore atteinte, ni déjà programmé/réussi/expiré). Doit en
   *  outre être inscrit sur le site choisi (une session ne regroupe qu'un seul site). */
  private estEligiblePour(candidat: Candidat, typeEpreuve: string, siteId: number | null): boolean {
    if (candidat.statutDossier === 'EXPIRE_NON_SOLDE' || candidat.etapeParcours !== typeEpreuve) {
      return false;
    }
    if (siteId != null && candidat.siteId !== siteId) {
      return false;
    }

    const ajournements = this.allExamens.filter(examen =>
      examen.candidatId === candidat.id && examen.typeEpreuve === typeEpreuve && examen.resultat === 'AJOURNE'
    ).length;
    return ajournements < 5;
  }

  private updateEligibleCandidats(): void {
    this.eligibleCandidats = this.allCandidats.filter(c => this.estEligiblePour(c, this.newPassage.typeEpreuve, this.newPassage.siteId));
  }

  isCandidatSelected(candidatId: number): boolean {
    return this.selectedCandidatIds.includes(candidatId);
  }

  toggleCandidat(candidatId: number): void {
    if (this.isCandidatSelected(candidatId)) {
      this.selectedCandidatIds = this.selectedCandidatIds.filter(id => id !== candidatId);
    } else {
      this.selectedCandidatIds = [...this.selectedCandidatIds, candidatId];
    }
  }

  saveProgrammer(): void {
    this.saving = true;
    this.formError = '';

    const payload = {
      candidatIds: this.selectedCandidatIds,
      typeEpreuve: this.newPassage.typeEpreuve,
      siteId: this.newPassage.siteId,
      datePassage: this.newPassage.datePassage,
      lieu: this.newPassage.lieu,
      observations: this.newPassage.observations
    };

    this.apiService.creerSession(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showProgrammerModal = false;
        this.loadSessions();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, 'Erreur lors de la programmation.');
      }
    });
  }

  openUpdateModal(p: PassageExamen): void {
    this.targetPassage = p;
    this.updateData = {
      datePassage: p.datePassage,
      resultat: p.resultat,
      observations: p.observations || ''
    };
    this.formError = '';
    this.showUpdateModal = true;
  }

  saveUpdateResultat(): void {
    if (!this.targetPassage) return;

    this.saving = true;
    this.formError = '';

    this.apiService.updateResultatPassage(this.targetPassage.id, this.updateData).subscribe({
      next: () => {
        this.saving = false;
        this.showUpdateModal = false;
        this.loadSessions();
        if (this.sessionDetail) {
          this.openSessionDetail(this.sessionDetail.id);
        }
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, 'Erreur lors de la mise à jour.');
      }
    });
  }

  getResultatAffiche(p: PassageExamen): string {
    return this.resultatsEnAttente[p.id] !== undefined ? this.resultatsEnAttente[p.id] : p.resultat;
  }

  isResultatModifie(p: PassageExamen): boolean {
    return this.resultatsEnAttente[p.id] !== undefined && this.resultatsEnAttente[p.id] !== p.resultat;
  }

  proposerResultat(p: PassageExamen, nouveauResultat: 'REUSSI' | 'AJOURNE'): void {
    if (this.savingResultats) return;
    // Si on reclique sur le résultat déjà persistant en base et qu'aucune modif n'était en attente
    if (p.resultat === nouveauResultat && this.resultatsEnAttente[p.id] === undefined) {
      return;
    }
    // Si on reclique sur le résultat d'origine alors qu'il était modifié localement, on annule pour ce passage
    if (p.resultat === nouveauResultat) {
      delete this.resultatsEnAttente[p.id];
    } else {
      this.resultatsEnAttente[p.id] = nouveauResultat;
    }
  }

  get hasModificationsResultats(): boolean {
    return Object.keys(this.resultatsEnAttente).length > 0;
  }

  getNbModificationsResultats(): number {
    return Object.keys(this.resultatsEnAttente).length;
  }

  annulerModificationsResultats(): void {
    this.resultatsEnAttente = {};
  }

  enregistrerModificationsResultats(): void {
    if (!this.sessionDetail || !this.hasModificationsResultats) return;
    this.savingResultats = true;
    this.sessionError = '';

    const passageIds = Object.keys(this.resultatsEnAttente).map(Number);
    const requests = passageIds.map(id => {
      const p = this.sessionDetail!.candidats.find(c => c.id === id);
      const nouveauResultat = this.resultatsEnAttente[id];
      const payload = {
        datePassage: p?.datePassage || this.sessionDetail!.datePassage || new Date().toISOString().substring(0, 10),
        resultat: nouveauResultat,
        observations: p?.observations || ''
      };
      return this.apiService.updateResultatPassage(id, payload);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.savingResultats = false;
        this.resultatsEnAttente = {};
        if (this.sessionDetail) {
          this.openSessionDetail(this.sessionDetail.id);
        }
        this.loadSessions();
      },
      error: (err) => {
        this.savingResultats = false;
        this.sessionError = extraireMessageErreur(err, "Erreur lors de l'enregistrement des résultats.");
      }
    });
  }

  formatStatut(statut?: string): string {
    switch (statut) {
      case 'EN_COURS': return 'En cours';
      case 'TERMINE': return 'Terminé';
      case 'PROGRAMME':
      default: return 'Programmé';
    }
  }

  // --- ACTIONS RAPIDES SESSION (ICÔNES DU TABLEAU) ---

  openQuickAffecterModal(s: SessionExamen): void {
    this.quickTargetSession = s;
    this.quickSelectionIds = [];
    this.quickAffecterError = '';
    this.quickFilterSiteId = '';

    const idsExistants = new Set(s.candidats.map(p => p.candidatId));
    this.quickEligibleCandidats = this.allCandidats.filter(c =>
      !idsExistants.has(c.id) && this.estEligiblePour(c, s.typeEpreuve, null)
    );
    this.showQuickAffecterModal = true;
  }

  get quickEligibleCandidatsFiltres(): Candidat[] {
    if (!this.quickFilterSiteId) {
      return this.quickEligibleCandidats;
    }
    return this.quickEligibleCandidats.filter(c => String(c.siteId) === this.quickFilterSiteId);
  }

  onQuickFilterSiteChange(): void {
    // La liste se met à jour réactivement via le getter quickEligibleCandidatsFiltres
  }

  isQuickSelected(candidatId: number): boolean {
    return this.quickSelectionIds.includes(candidatId);
  }

  toggleQuickCandidat(candidatId: number): void {
    this.quickSelectionIds = this.isQuickSelected(candidatId)
      ? this.quickSelectionIds.filter(id => id !== candidatId)
      : [...this.quickSelectionIds, candidatId];
  }

  confirmerQuickAffecter(): void {
    if (!this.quickTargetSession || this.quickSelectionIds.length === 0) return;
    const sessionId = this.quickTargetSession.id;
    this.savingQuickAffecter = true;
    this.quickAffecterError = '';

    this.apiService.ajouterCandidatsASession(sessionId, this.quickSelectionIds).subscribe({
      next: () => {
        this.savingQuickAffecter = false;
        this.showQuickAffecterModal = false;
        this.loadSessions();
        this.loadCandidats();
      },
      error: (err) => {
        this.savingQuickAffecter = false;
        this.quickAffecterError = extraireMessageErreur(err, "Erreur lors de l'affectation des candidats.");
      }
    });
  }

  openEditSessionModal(s: SessionExamen): void {
    this.editTargetSession = s;
    this.editSessionError = '';
    this.editSessionForm = {
      datePassage: s.datePassage,
      lieu: s.lieu || '',
      siteId: s.siteId ?? null,
      observations: s.observations || ''
    };
    this.showEditSessionModal = true;
  }

  saveEditSession(): void {
    if (!this.editTargetSession || !this.editSessionForm.datePassage || !this.editSessionForm.lieu) return;
    this.savingEditSession = true;
    this.editSessionError = '';

    this.apiService.modifierSession(this.editTargetSession.id, this.editSessionForm).subscribe({
      next: () => {
        this.savingEditSession = false;
        this.showEditSessionModal = false;
        this.loadSessions();
      },
      error: (err) => {
        this.savingEditSession = false;
        this.editSessionError = extraireMessageErreur(err, 'Erreur lors de la modification de la session.');
      }
    });
  }

  supprimerSession(s: SessionExamen): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la session du ${s.datePassage} (${this.epreuveLabel(s.typeEpreuve)}) ?\nLes candidats inscrits seront libérés.`)) {
      return;
    }

    this.apiService.deleteSession(s.id).subscribe({
      next: () => {
        this.loadSessions();
        this.loadCandidats();
      },
      error: (err) => {
        alert(extraireMessageErreur(err, 'Erreur lors de la suppression de la session.'));
      }
    });
  }

  getBadgeClass(res: string): string {
    switch (res) {
      case 'REUSSI': return 'badge-reussi';
      case 'AJOURNE': return 'badge-ajourne';
      default: return 'badge-programme';
    }
  }
}
