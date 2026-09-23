import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, CategoriePermis, Site, IdentifiantsCompte, CandidatStatistiques } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-candidats',
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="candidats-page">
      <!-- HEADER ACTIONS -->
      <div class="page-header-bar">
        <div>
          <h2>Gestion des Inscrits</h2>
        </div>
        <div class="header-buttons">
          @if (canSeeFinancialData) {
            <button class="btn btn-outline btn-sm" (click)="exporterPdf()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Export PDF
            </button>
            <button class="btn btn-outline btn-sm" (click)="imprimerListe()" title="Imprimer directement">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer
            </button>
          }
          @if (canSeeFinancialData) {
            <button class="btn btn-outline btn-sm" (click)="exporterExcel()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Export Excel
            </button>
          }
          @if (canProgramExams && selectedCandidats.size > 0) {
            <button class="btn btn-warning" (click)="openProgramModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Programmer ({{ selectedCandidats.size }})
            </button>
          }
          @if (canEdit) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
              Nouveau Inscrit
            </button>
          }
        </div>
      </div>

      <!-- CARTE STATISTIQUE UNIQUE "INSCRITS" AVEC ACTION DÉTAIL -->
      <div class="stats-sexe-bar">
        <div class="stats-sexe-box inscrits">
          @if (statsSexe && statsSexe.parSite && statsSexe.parSite.length > 0) {
            <button type="button" class="stat-action-btn" (click)="showSiteModal = true" title="Voir le détail par site">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          }
          <span class="stats-sexe-label">Inscrits</span>
          <span class="stats-sexe-value">{{ (statsSexe?.totalHommes || 0) + (statsSexe?.totalFemmes || 0) + (statsSexe?.totalNonRenseigne || 0) }}</span>
          <div class="stats-sexe-details">
            {{ statsSexe?.totalHommes || 0 }} hommes • {{ statsSexe?.totalFemmes || 0 }} femmes
            @if (statsSexe && statsSexe.totalNonRenseigne > 0) {
              • {{ statsSexe.totalNonRenseigne }} non renseigné(s)
            }
          </div>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div class="search-box">
            <span class="search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
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
            <select class="form-control" [(ngModel)]="statutInscriptionFiltre" (change)="loadCandidats()">
              <option value="">Nouveaux et redoublants</option>
              <option value="NOUVEAU">Nouveaux</option>
              <option value="REDOUBLANT">Redoublants</option>
            </select>
          </div>

          <div>
            <select class="form-control" [(ngModel)]="siteFiltre" (change)="loadCandidats()">
              <option value="">Tous les sites</option>
              @for (s of sites; track s) {
                <option [value]="s.id">{{ s.nom }}</option>
              }
            </select>
          </div>

          <div>
            <select class="form-control" [(ngModel)]="etapeFiltre" (change)="loadCandidats()">
              <option value="">Toutes les étapes</option>
              @for (e of etapesParcours; track e) {
                <option [value]="e">{{ etapeLabel(e) }}</option>
              }
            </select>
          </div>

          <div>
            <select class="form-control" [(ngModel)]="priseEnChargeExamensFiltre" (change)="loadCandidats()">
              <option value="">Frais d'examen : tous</option>
              <option value="true">Frais d'examen pris en charge</option>
              <option value="false">Frais d'examen non pris en charge</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              class="form-control"
              [(ngModel)]="dateExamenProgrammeFiltre"
              (change)="loadCandidats()"
              title="Programmés pour un examen à cette date"
              />
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
                @if (canProgramExams) {
                  <th style="width: 40px"><input type="checkbox" (change)="toggleAll($event)"></th>
                }
                <th>N° Dossier</th>
                <th>Inscrit</th>
                <th>Contact</th>
                <th>Permis</th>
                @if (canProgramExams) {
                  <th>Programmé</th>
                }
                @if (canSeeFinancialData) {
                  <th>Statut</th>
                  <th>Échéance</th>
                }
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="8" class="text-center py-4">Chargement des inscrits...</td>
                </tr>
              }
              @if (!loading && candidats.length === 0) {
                <tr>
                  <td colspan="8" class="text-center py-4">Aucun inscrit trouvé pour ces critères.</td>
                </tr>
              }
              @for (c of candidats; track c) {
                <tr>
                  @if (canProgramExams) {
                    <td>
                      <input type="checkbox" [checked]="selectedCandidats.has(c.id)" [disabled]="estProgramme(c)"
                        title="{{ estProgramme(c) ? 'Déjà programmé pour un examen en cours' : '' }}"
                        (change)="toggleSelection(c.id)">
                    </td>
                  }
                  <td>
                    <strong class="dossier-code">{{ c.numeroDossier }}</strong>
                  </td>
                  <td>
                    <div class="candidat-name">
                      {{ c.nom }} {{ c.prenom }}
                      @if (c.statutInscription === 'REDOUBLANT') {
                        <span class="badge badge-ajourne redoublant-badge">Redoublant</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="contact-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {{ c.telephone }}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-programme">{{ c.categoriePermisCode }}</span>
                  </td>
                  @if (canProgramExams) {
                    <td>
                      <span class="badge" [ngClass]="estProgramme(c) ? 'badge-programme' : 'badge-solde'">
                        {{ estProgramme(c) ? 'Oui' : 'Non' }}
                      </span>
                    </td>
                  }
                  @if (canSeeFinancialData) {
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-solde': c.statutDossier === 'SOLDE',
                        'badge-en-cours': c.statutDossier === 'EN_COURS',
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
                  }
                  <td class="text-right">
                    <div class="table-actions">
                      <a [routerLink]="['/candidats', c.id]" class="btn btn-outline btn-xs" title="Fiche complète">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </a>
                      @if (canEdit) {
                        <button class="btn btn-outline btn-xs" (click)="openEditModal(c)" title="Modifier">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                      }
                      @if (canResetPassword) {
                        <button class="btn btn-outline btn-xs" (click)="resetPassword(c)" title="Réinitialiser le mot de passe">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </button>
                      }
                      @if (isAdmin) {
                        <button class="btn btn-danger btn-xs" (click)="openDeleteModal(c)" title="Supprimer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Précédent
            </button>
            <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} inscrits)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">
              Suivant
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        }
      </div>
    
      <!-- MODAL CRÉATION CANDIDAT -->
      @if (showCreateModal) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Inscription d'un Nouvel Inscrit
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showCreateModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveCreateCandidat()">
              <div class="modal-body">
                @if (modalError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ modalError }}
                  </div>
                }
                @if (doublonDetecte && !modeReinscription) {
                  <div class="alert alert-warning doublon-alert">
                    <div style="display:flex; align-items:flex-start; gap:0.5rem;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:0.15rem;"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span>Un inscrit existe déjà avec ce numéro : <strong>{{ doublonDetecte.numeroDossier }}</strong> — {{ doublonDetecte.nom }} {{ doublonDetecte.prenom }} (statut : {{ doublonDetecte.statutDossier }})</span>
                    </div>
                    <div class="doublon-actions">
                      <button type="button" class="btn btn-primary btn-sm" (click)="rattacherDoublon()">Rattacher à ce dossier (nouvelle inscription)</button>
                      <button type="button" class="btn btn-secondary btn-sm" (click)="ignorerDoublon()">Continuer avec un dossier séparé</button>
                    </div>
                  </div>
                }
                @if (modeReinscription) {
                  <div class="alert alert-info doublon-alert">
                    <div style="display:flex; align-items:flex-start; gap:0.5rem;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:0.15rem;"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                      <span>Réinscription de <strong>{{ doublonDetecte?.nom }} {{ doublonDetecte?.prenom }}</strong> ({{ doublonDetecte?.numeroDossier }}) — nouveau cycle marqué « Redoublant ».</span>
                    </div>
                    <div class="doublon-actions">
                      <button type="button" class="btn btn-outline btn-sm" (click)="annulerReinscription()">Annuler / choisir un autre inscrit</button>
                    </div>
                  </div>
                }
                @if (!modeReinscription) {
                  <h4 class="section-title">1. Informations Personnelles</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Nom <span class="required">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="newCandidat.nom" name="nom" required />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Prénom(s) <span class="required">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="newCandidat.prenom" name="prenom" required />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Date de naissance <span class="required">*</span></label>
                      <input type="date" class="form-control" [(ngModel)]="newCandidat.dateNaissance" name="dateNaissance" required />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Lieu de naissance</label>
                      <input type="text" class="form-control" [(ngModel)]="newCandidat.lieuNaissance" name="lieuNaissance" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Numéro Téléphone <span class="required">*</span></label>
                      <input type="tel" class="form-control" [(ngModel)]="newCandidat.telephone" name="telephone" required placeholder="+226 ..." (blur)="verifierDoublon()" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Adresse Email</label>
                      <input type="email" class="form-control" [(ngModel)]="newCandidat.email" name="email" placeholder="candidat@email.com" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Sexe <span class="required">*</span></label>
                      <select class="form-control" [(ngModel)]="newCandidat.sexe" name="sexe" required>
                        <option value="HOMME">Homme</option>
                        <option value="FEMME">Femme</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Autres contacts utiles / Personne à prévenir</label>
                      <input type="text" class="form-control" [(ngModel)]="newCandidat.contactsUrgence" name="contactsUrgence" />
                    </div>
                  </div>
                }
                <h4 class="section-title">2. Inscription & Tarif</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Statut de l'inscrit</label>
                    <select class="form-control" [(ngModel)]="newCandidat.statutInscription" name="statutInscription" (change)="onStatutInscriptionChange()">
                      <option value="NOUVEAU">Nouveau</option>
                      <option value="REDOUBLANT">Redoublant</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Étape actuelle</label>
                    @if (newCandidat.statutInscription === 'NOUVEAU') {
                      <select class="form-control" [ngModel]="'INSCRIPTION'" name="etapeParcours" [disabled]="true">
                        <option value="INSCRIPTION">Inscription</option>
                      </select>
                      <small class="text-muted">Verrouillé sur Inscription pour un nouvel inscrit.</small>
                    } @else {
                      <select class="form-control" [(ngModel)]="newCandidat.etapeParcours" name="etapeParcours">
                        @for (e of etapesRedoublant; track e) {
                          <option [value]="e">{{ etapeLabel(e) }}</option>
                        }
                      </select>
                    }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Catégorie de permis <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newCandidat.categoriePermisId" name="categoriePermisId" required (change)="onCategorieChange()">
                      @for (cat of categories; track cat) {
                        <option [value]="cat.id">{{ cat.code }} — {{ cat.libelle }} ({{ cat.montant | number }} FCFA)</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Site de formation <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newCandidat.siteId" name="siteId" required>
                      @for (s of sitesAutorises; track s) {
                        <option [value]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Montant de formation (FCFA) <span class="required">*</span></label>
                    <input type="number" class="form-control" [(ngModel)]="newCandidat.montant" name="montant" required />
                    <small class="text-muted">Pré-rempli selon la catégorie choisie, modifiable si besoin.</small>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Frais d'examen (FCFA)</label>
                    <input type="number" class="form-control" [(ngModel)]="newCandidat.fraisExamen" name="fraisExamen" />
                    <small class="text-muted">Pré-rempli selon la catégorie, modifiable.</small>
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
                <div class="form-group form-check" style="margin-top: 4px;">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="newCandidat.priseEnChargeExamens" name="priseEnChargeExamens" />
                    Inclus dans les frais (prise en charge totale des frais d'examen)
                  </label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  @if (saving) { Enregistrement... } @else { Enregistrer l'Inscrit }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    
      <!-- MODAL MODIFICATION -->
      @if (showEditModal) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Modifier l'Inscrit — {{ selectedCandidat?.numeroDossier }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showEditModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveEditCandidat()">
              <div class="modal-body">
                @if (editError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ editError }}
                  </div>
                }
                <h4 class="section-title">Informations Personnelles</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Nom de famille <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="editCandidat.nom" name="editNom" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Prénom(s) <span class="required">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="editCandidat.prenom" name="editPrenom" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Date de naissance <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="editCandidat.dateNaissance" name="editDateNaissance" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Lieu de naissance</label>
                    <input type="text" class="form-control" [(ngModel)]="editCandidat.lieuNaissance" name="editLieuNaissance" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Numéro Téléphone <span class="required">*</span></label>
                    <input type="tel" class="form-control" [(ngModel)]="editCandidat.telephone" name="editTelephone" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Adresse Email</label>
                    <input type="email" class="form-control" [(ngModel)]="editCandidat.email" name="editEmail" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Sexe <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="editCandidat.sexe" name="editSexe" required>
                      <option value="HOMME">Homme</option>
                      <option value="FEMME">Femme</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Autres contacts utiles / Personne à prévenir</label>
                  <input type="text" class="form-control" [(ngModel)]="editCandidat.contactsUrgence" name="editContactsUrgence" />
                </div>
                <h4 class="section-title">Inscription & Tarif</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Catégorie de permis <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="editCandidat.categoriePermisId" name="editCategoriePermisId" required (change)="onEditCategorieChange()">
                      @for (cat of categories; track cat) {
                        <option [value]="cat.id">{{ cat.code }} — {{ cat.libelle }} ({{ cat.montant | number }} FCFA)</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Montant (FCFA) <span class="required">*</span></label>
                    <input type="number" class="form-control" [(ngModel)]="editCandidat.montant" name="editMontant" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Site de formation <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="editCandidat.siteId" name="editSiteId" required>
                      @for (s of sitesAutorises; track s) {
                        <option [value]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date de réception dossier</label>
                    <input type="date" class="form-control" [(ngModel)]="editCandidat.dateReceptionDossier" name="editDateReceptionDossier" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Frais d'examen (FCFA)</label>
                    <input type="number" class="form-control" [(ngModel)]="editCandidat.fraisExamen" name="editFraisExamen" />
                    <small class="text-muted">Pré-rempli selon la catégorie, modifiable.</small>
                  </div>
                </div>
                <div class="form-group form-check" style="margin-top: 4px;">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="editCandidat.priseEnChargeExamens" name="editPriseEnChargeExamens" />
                    Les frais de formation englobent la prise en charge totale des frais d'examen
                  </label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showEditModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  @if (saving) { Enregistrement... } @else { Enregistrer les modifications }
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
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Confirmation de Suppression
              </h3>
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

      <!-- MODAL IDENTIFIANTS COMPTE CANDIDAT (affichage unique) -->
      @if (identifiantsCompteAAfficher) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                Identifiants du compte de l'inscrit
              </h3>
              <button class="btn btn-outline btn-sm" (click)="identifiantsCompteAAfficher = null">✕</button>
            </div>
            <div class="modal-body">
              <p>Communiquez ces identifiants à l'inscrit dès maintenant : ils ne seront plus jamais affichés.</p>
              <div class="form-group mt-3">
                <label class="form-label">Identifiant</label>
                <input type="text" class="form-control" [value]="identifiantsCompteAAfficher.username" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Mot de passe temporaire</label>
                <input type="text" class="form-control" [value]="identifiantsCompteAAfficher.motDePasseTemporaire" readonly />
              </div>
              <p class="form-help">L'inscrit devra changer ce mot de passe à sa prochaine connexion.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" (click)="identifiantsCompteAAfficher = null">J'ai noté les identifiants</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL PROGRAMMATION EXAMENS -->
      @if (showProgramModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Programmer un Examen ({{ selectedCandidats.size }} candidat(s))
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showProgramModal = false">✕</button>
            </div>
            <form (ngSubmit)="submitProgrammation()">
              <div class="modal-body">
                @if (programError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ programError }}
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Type d'Épreuve <span class="required">*</span></label>
                  @if (epreuvesAutorisees.length > 1) {
                    <select class="form-control" [(ngModel)]="programData.typeEpreuve" name="typeEpreuve" required>
                      @for (t of epreuvesAutorisees; track t) {
                        <option [value]="t">{{ epreuveLabel(t) }}</option>
                      }
                    </select>
                  } @else {
                    <input class="form-control" type="text" [value]="epreuveLabel(programData.typeEpreuve)" disabled />
                  }
                </div>
                <div class="form-group">
                  <label class="form-label">Site <span class="required">*</span></label>
                  @if (sitesAutorises.length > 1) {
                    <select class="form-control" [(ngModel)]="programData.siteId" name="siteId" required>
                      <option [ngValue]="null" disabled>Sélectionner un site</option>
                      @for (s of sitesAutorises; track s.id) {
                        <option [ngValue]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                  } @else {
                    <input class="form-control" type="text" [value]="sitesAutorises[0]?.nom || ''" disabled />
                  }
                </div>
                <div class="form-group">
                  <label class="form-label">Date prévue <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="programData.datePassage" name="datePassage" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Observations (facultatif)</label>
                  <textarea class="form-control" [(ngModel)]="programData.observations" name="observations" rows="2"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showProgramModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="savingProgram || !programData.siteId">
                  @if (savingProgram) { Enregistrement... } @else { Confirmer }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL DÉTAIL DES INSCRITS PAR SITE -->
      @if (showSiteModal) {
        <div class="modal-backdrop">
          <div class="modal-content modal-md">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Détail des Inscrits par Site
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showSiteModal = false">✕</button>
            </div>
            <div class="modal-body">
              @if (!statsSexe?.parSite || statsSexe!.parSite.length === 0) {
                <div class="empty-state">
                  Aucune donnée par site disponible.
                </div>
              }
              @if (statsSexe?.parSite && statsSexe!.parSite.length > 0) {
                <div class="table-responsive">
                  <table class="custom-table">
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th style="text-align: center;">Hommes</th>
                        <th style="text-align: center;">Femmes</th>
                        @if (statsSexe!.totalNonRenseigne > 0) {
                          <th style="text-align: center;">Non renseigné</th>
                        }
                        <th style="text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of statsSexe!.parSite; track s.siteNom) {
                        <tr>
                          <td><strong>{{ s.siteNom }}</strong></td>
                          <td style="text-align: center;">{{ s.hommes }}</td>
                          <td style="text-align: center;">{{ s.femmes }}</td>
                          @if (statsSexe!.totalNonRenseigne > 0) {
                            <td style="text-align: center;">{{ s.nonRenseigne }}</td>
                          }
                          <td style="text-align: right;"><strong>{{ s.total }}</strong></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showSiteModal = false">Fermer</button>
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
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .page-header-bar h2 {
      color: var(--primary);
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }

    .header-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .stats-sexe-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stats-sexe-box {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.4rem;
      min-width: 140px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
      position: relative;
    }

    .stats-sexe-box:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stats-sexe-box.inscrits { border-left: 4px solid var(--accent); min-width: 240px; }
    .stats-sexe-box.hommes { border-left: 4px solid var(--cobalt); }
    .stats-sexe-box.femmes { border-left: 4px solid var(--accent); }
    .stats-sexe-box.non-renseigne { border-left: 4px solid var(--text-muted); }

    .stat-action-btn {
      position: absolute;
      top: 0.65rem;
      right: 0.65rem;
      width: 1.85rem;
      height: 1.85rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.9);
      color: var(--text-dark, #334155);
      cursor: pointer;
      opacity: 0.85;
      transition: all var(--transition-fast);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      z-index: 2;
    }

    .stat-action-btn:hover {
      opacity: 1;
      background: #ffffff;
      color: var(--primary);
      border-color: var(--primary);
      transform: scale(1.08);
    }

    .stats-sexe-details {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
      font-weight: 500;
    }

    .stats-sexe-value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.02em;
    }

    .stats-sexe-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

    .contact-line {
      display: flex;
      align-items: center;
      gap: 0.35rem;
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

    .doublon-alert {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .doublon-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .redoublant-badge {
      margin-left: 0.4rem;
      font-size: 0.65rem;
      vertical-align: middle;
    }
  `]
})
export class CandidatsComponent implements OnInit {
  candidats: Candidat[] = [];
  categories: CategoriePermis[] = [];
  sites: Site[] = [];
  loading = false;
  saving = false;
  statsSexe: CandidatStatistiques | null = null;

  recherche = '';
  statutFiltre = '';
  categorieFiltre = '';
  statutInscriptionFiltre = '';
  siteFiltre = '';
  etapeFiltre = '';
  priseEnChargeExamensFiltre = '';
  dateExamenProgrammeFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  etapesParcours = ['INSCRIPTION', 'CODE', 'EXAMEN_CODE', 'CRENEAU', 'EXAMEN_CRENEAU', 'CIRCULATION', 'EXAMEN_CIRCULATION', 'PERMIS_OBTENU', 'EXPIRE'];
  etapesRedoublant = ['INSCRIPTION', 'CODE', 'CRENEAU', 'CIRCULATION'];

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showSiteModal = false;
  identifiantsCompteAAfficher: IdentifiantsCompte | null = null;
  selectedCandidat: Candidat | null = null;
  editCandidat: any = {};
  deleteMotif = '';
  modalError = '';
  editError = '';

  doublonDetecte: Candidat | null = null;
  doublonIgnore = false;
  modeReinscription = false;

  newCandidat: any = {
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: 'HOMME',
    telephone: '',
    email: '',
    contactsUrgence: '',
    dateInscription: new Date().toISOString().substring(0, 10),
    categoriePermisId: null,
    montant: null,
    siteId: null,
    statutInscription: 'NOUVEAU',
    etapeParcours: 'INSCRIPTION',
    priseEnChargeExamens: false,
    fraisExamen: null
  };

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadParams();
    this.loadCandidats();
  }

  get canEdit(): boolean {
    return this.authService.hasPermission(['CANDIDATS_MODIFIER']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  get canResetPassword(): boolean {
    return this.authService.hasPermission(['UTILISATEURS_RESET_PASSWORD']);
  }

  get canSeeFinancialData(): boolean {
    return this.authService.hasPermission(['PAIEMENTS_VOIR']);
  }

  /** Types d'épreuves programmables par l'utilisateur courant : non restreint pour
   *  ADMIN, limité à sa spécialité pour un MONITEUR (aucune spécialité => aucune épreuve). */
  get epreuvesAutorisees(): string[] {
    const user = this.authService.currentUserValue;
    if (user?.role === 'MONITEUR') {
      return user.specialites || [];
    }
    return ['CODE', 'CRENEAU', 'CIRCULATION'];
  }

  /** Seul le moniteur programme des examens : l'administrateur valide ou retire
   *  les propositions depuis la page Examens, il ne programme pas lui-même. */
  get canProgramExams(): boolean {
    const user = this.authService.currentUserValue;
    return user?.role === 'MONITEUR' && this.epreuvesAutorisees.length > 0;
  }

  /** Sites sur lesquels l'utilisateur courant peut inscrire un candidat ou programmer un
   *  examen : limités à ses sites d'affectation pour un moniteur ou une secrétaire, tous
   *  les sites pour ADMIN/CAISSIERE (qui n'inscrivent pas de candidat). */
  get sitesAutorises(): Site[] {
    const user = this.authService.currentUserValue;
    if (user?.role === 'MONITEUR' || user?.role === 'SECRETAIRE') {
      return this.sites.filter(s => user.siteIds?.includes(s.id));
    }
    return this.sites;
  }

  // --- Exam Programming logic ---
  selectedCandidats = new Set<number>();
  showProgramModal = false;
  savingProgram = false;
  programError = '';
  programData: any = {
    typeEpreuve: 'CODE',
    siteId: null,
    datePassage: '',
    observations: ''
  };

  /** Étant déjà programmé pour un examen en cours (résultat en attente), le candidat ne
   *  doit plus pouvoir être sélectionné pour une nouvelle session tant que celui-ci n'est
   *  pas noté, retiré ou reprogrammé. */
  estProgramme(c: Candidat): boolean {
    return !!c.etapeParcours && c.etapeParcours.startsWith('EXAMEN_');
  }

  toggleSelection(id: number): void {
    const candidat = this.candidats.find(c => c.id === id);
    if (candidat && this.estProgramme(candidat)) return;
    if (this.selectedCandidats.has(id)) {
      this.selectedCandidats.delete(id);
    } else {
      this.selectedCandidats.add(id);
    }
  }

  toggleAll(event: any): void {
    if (event.target.checked) {
      this.candidats.filter(c => !this.estProgramme(c)).forEach(c => this.selectedCandidats.add(c.id));
    } else {
      this.selectedCandidats.clear();
    }
  }

  epreuveLabel(t: string): string {
    const labels: Record<string, string> = { CODE: 'Code', CRENEAU: 'Créneau', CIRCULATION: 'Circulation' };
    return labels[t] || t;
  }

  openProgramModal(): void {
    this.programError = '';
    this.programData = {
      typeEpreuve: this.epreuvesAutorisees[0] || 'CODE',
      siteId: this.sitesAutorises.length === 1 ? this.sitesAutorises[0].id : null,
      datePassage: '',
      observations: ''
    };
    this.showProgramModal = true;
  }

  submitProgrammation(): void {
    if (this.selectedCandidats.size === 0) return;
    this.savingProgram = true;
    const payload = {
      candidatIds: Array.from(this.selectedCandidats),
      typeEpreuve: this.programData.typeEpreuve,
      siteId: this.programData.siteId,
      datePassage: this.programData.datePassage,
      observations: this.programData.observations
    };

    this.apiService.creerSession(payload).subscribe({
      next: () => {
        this.savingProgram = false;
        this.showProgramModal = false;
        this.selectedCandidats.clear();
        alert('Candidats programmés avec succès !');
      },
      error: (err) => {
        this.savingProgram = false;
        this.programError = extraireMessageErreur(err, 'Erreur lors de la programmation.');
      }
    });
  }

  loadParams(): void {
    this.apiService.getCategories(true).subscribe({
      next: (res) => {
        this.categories = res;
        if (this.categories.length > 0) {
          this.newCandidat.categoriePermisId = this.categories[0].id;
          this.newCandidat.montant = this.categories[0].montant;
        }
      }
    });
    this.apiService.getSites(true).subscribe({
      next: (res) => {
        this.sites = res;
        if (this.sitesAutorises.length > 0) this.newCandidat.siteId = this.sitesAutorises[0].id;
      }
    });
  }

  loadCandidats(): void {
    this.loading = true;
    const catId = this.categorieFiltre ? Number(this.categorieFiltre) : undefined;
    const siteId = this.siteFiltre ? Number(this.siteFiltre) : undefined;
    const priseEnCharge = this.priseEnChargeExamensFiltre ? this.priseEnChargeExamensFiltre === 'true' : undefined;
    this.apiService.getCandidats(this.recherche, this.statutFiltre, catId, this.page, 15, this.statutInscriptionFiltre || undefined, undefined, siteId, this.etapeFiltre || undefined, priseEnCharge, this.dateExamenProgrammeFiltre || undefined).subscribe({
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
    this.loadStatsSexe();
  }

  /** Répartition homme/femme (globale + par site) recalculée sur exactement les mêmes
   *  filtres que la liste, pour qu'elle bouge avec eux plutôt que de rester figée. */
  private loadStatsSexe(): void {
    const catId = this.categorieFiltre ? Number(this.categorieFiltre) : undefined;
    const siteId = this.siteFiltre ? Number(this.siteFiltre) : undefined;
    const priseEnCharge = this.priseEnChargeExamensFiltre ? this.priseEnChargeExamensFiltre === 'true' : undefined;
    this.apiService.getCandidatsStatistiques(this.recherche, this.statutFiltre, catId, this.statutInscriptionFiltre || undefined, siteId, this.etapeFiltre || undefined, priseEnCharge, this.dateExamenProgrammeFiltre || undefined).subscribe({
      next: (res) => this.statsSexe = res,
      error: (err) => { console.error(err); this.statsSexe = null; }
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
    this.statutInscriptionFiltre = '';
    this.siteFiltre = '';
    this.etapeFiltre = '';
    this.priseEnChargeExamensFiltre = '';
    this.dateExamenProgrammeFiltre = '';
    this.page = 0;
    this.loadCandidats();
  }

  etapeLabel(e: string): string {
    const labels: Record<string, string> = {
      INSCRIPTION: 'Inscription',
      CODE: 'Code',
      EXAMEN_CODE: 'Examen Code',
      CRENEAU: 'Créneau',
      EXAMEN_CRENEAU: 'Examen Créneau',
      CIRCULATION: 'Circulation',
      EXAMEN_CIRCULATION: 'Examen Circulation',
      PERMIS_OBTENU: 'Permis obtenu',
      EXPIRE: 'Expiré'
    };
    return labels[e] || e;
  }

  openCreateModal(): void {
    this.modalError = '';
    this.doublonDetecte = null;
    this.doublonIgnore = false;
    this.modeReinscription = false;
    this.newCandidat = {
      nom: '',
      prenom: '',
      dateNaissance: '',
      lieuNaissance: '',
      sexe: 'HOMME',
      telephone: '',
      email: '',
      contactsUrgence: '',
      dateInscription: new Date().toISOString().substring(0, 10),
      categoriePermisId: this.categories.length > 0 ? this.categories[0].id : null,
      montant: this.categories.length > 0 ? this.categories[0].montant : null,
      fraisExamen: this.categories.length > 0 ? (this.categories[0].fraisExamen || null) : null,
      siteId: this.sitesAutorises.length > 0 ? this.sitesAutorises[0].id : null,
      statutInscription: 'NOUVEAU',
      etapeParcours: 'INSCRIPTION',
      priseEnChargeExamens: false
    };
    this.showCreateModal = true;
  }

  openEditModal(c: Candidat): void {
    this.selectedCandidat = c;
    this.editError = '';
    this.editCandidat = {
      nom: c.nom,
      prenom: c.prenom,
      dateNaissance: c.dateNaissance ? c.dateNaissance.substring(0, 10) : '',
      lieuNaissance: c.lieuNaissance || '',
      sexe: c.sexe || 'HOMME',
      telephone: c.telephone,
      email: c.email || '',
      contactsUrgence: c.contactsUrgence || '',
      dateReceptionDossier: c.dateReceptionDossier ? c.dateReceptionDossier.substring(0, 10) : '',
      categoriePermisId: c.categoriePermisId,
      montant: c.montantForfait,
      fraisExamen: c.fraisExamen || null,
      siteId: c.siteId ?? (this.sitesAutorises.length > 0 ? this.sitesAutorises[0].id : null),
      priseEnChargeExamens: c.priseEnChargeExamens
    };
    this.showEditModal = true;
  }

  onEditCategorieChange(): void {
    const cat = this.categories.find(cat => cat.id === Number(this.editCandidat.categoriePermisId));
    if (cat) {
      this.editCandidat.montant = cat.montant;
      this.editCandidat.fraisExamen = cat.fraisExamen || null;
    }
  }

  saveEditCandidat(): void {
    if (!this.selectedCandidat) return;
    this.saving = true;
    this.editError = '';
    this.apiService.updateCandidat(this.selectedCandidat.id, this.editCandidat).subscribe({
      next: () => {
        this.saving = false;
        this.showEditModal = false;
        this.loadCandidats();
      },
      error: (err) => {
        this.saving = false;
        this.editError = extraireMessageErreur(err, 'Erreur lors de la modification du candidat.');
      }
    });
  }

  onCategorieChange(): void {
    const cat = this.categories.find(c => c.id === Number(this.newCandidat.categoriePermisId));
    if (cat) {
      this.newCandidat.montant = cat.montant;
      this.newCandidat.fraisExamen = cat.fraisExamen || null;
    }
  }

  onStatutInscriptionChange(): void {
    if (this.newCandidat.statutInscription === 'NOUVEAU') {
      this.newCandidat.etapeParcours = 'INSCRIPTION';
    }
  }

  verifierDoublon(): void {
    const telephone = this.newCandidat.telephone?.trim();
    this.doublonDetecte = null;
    if (!telephone || telephone.length < 8 || this.doublonIgnore) return;

    this.apiService.getCandidats(telephone, undefined, undefined, 0, 5).subscribe({
      next: (res) => {
        const match = (res.content || []).find((c: Candidat) => c.telephone === telephone);
        if (match) this.doublonDetecte = match;
      }
    });
  }

  rattacherDoublon(): void {
    if (!this.doublonDetecte) return;
    this.modeReinscription = true;
    this.newCandidat.statutInscription = 'REDOUBLANT';
    this.modalError = '';
  }

  ignorerDoublon(): void {
    this.doublonDetecte = null;
    this.doublonIgnore = true;
  }

  annulerReinscription(): void {
    this.modeReinscription = false;
    this.doublonDetecte = null;
    this.doublonIgnore = true;
    this.newCandidat.statutInscription = 'NOUVEAU';
    this.newCandidat.etapeParcours = 'INSCRIPTION';
  }

  saveCreateCandidat(): void {
    this.saving = true;
    this.modalError = '';

    if (this.newCandidat.statutInscription === 'NOUVEAU') {
      this.newCandidat.etapeParcours = 'INSCRIPTION';
    }

    if (this.modeReinscription && this.doublonDetecte) {
      const payload = {
        categoriePermisId: this.newCandidat.categoriePermisId,
        montant: this.newCandidat.montant,
        fraisExamen: this.newCandidat.fraisExamen,
        siteId: this.newCandidat.siteId,
        dateInscription: this.newCandidat.dateInscription,
        priseEnChargeExamens: this.newCandidat.priseEnChargeExamens
      };
      this.apiService.reinscrireCandidat(this.doublonDetecte.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.showCreateModal = false;
          this.loadCandidats();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extraireMessageErreur(err, 'Erreur lors de la réinscription du candidat.');
        }
      });
      return;
    }

    this.apiService.createCandidat(this.newCandidat).subscribe({
      next: (res) => {
        this.saving = false;
        this.showCreateModal = false;
        if (res.identifiantsCompte) {
          this.identifiantsCompteAAfficher = res.identifiantsCompte;
        }
        this.loadCandidats();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = extraireMessageErreur(err, 'Erreur lors de la création du candidat.');
      }
    });
  }

  resetPassword(c: Candidat): void {
    if (!confirm(`Réinitialiser le mot de passe de ${c.nom} ${c.prenom} ? Son ancien mot de passe cessera immédiatement de fonctionner.`)) {
      return;
    }
    this.apiService.resetPasswordCandidat(c.id).subscribe({
      next: (identifiants) => this.identifiantsCompteAAfficher = identifiants,
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors de la réinitialisation du mot de passe.'))
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
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors de la suppression.'))
    });
  }

  exporterPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsPdfUrl(), 'candidats_auto_ecole.pdf');
  }

  imprimerListe(): void {
    this.apiService.printBlob(this.apiService.getCandidatsPdfUrl());
  }

  exporterExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsExcelUrl(), 'candidats_auto_ecole.xlsx');
  }
}
