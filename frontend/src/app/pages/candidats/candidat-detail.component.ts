import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Candidat,
  IdentifiantsCompte,
  Paiement,
  PassageExamen,
  BilanExamensCandidat,
  Recu,
  TarifsExamens
} from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-candidat-detail',
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    @if (candidat) {
      <div class="candidat-detail-page">
        <!-- TOP NAVIGATION & ACTIONS -->
        <div class="header-action-bar">
          <div>
            <a routerLink="/candidats" class="btn btn-outline btn-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Retour aux inscrits
            </a>
            <h2>Fiche Inscrit : {{ candidat.nom }} {{ candidat.prenom }}</h2>
            <span class="dossier-pill">N° Dossier : {{ candidat.numeroDossier }}</span>
          </div>
        </div>
        <!-- ALERTE EXPIRATION SI APPLICABLE -->
        @if (candidat.procheExpiration) {
          <div class="alert alert-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <strong>Attention :</strong> Ce dossier expire dans <strong>{{ candidat.joursRestants }} jours</strong> (le {{ candidat.dateEcheance | date:'dd/MM/yyyy' }}).
          </div>
        }
        @if (canSeeFinancialData && candidat.statutDossier === 'EXPIRE_NON_SOLDE') {
          <div class="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            <strong>Dossier Expiré non soldé :</strong> La période de validité de 8 mois est échue avec un solde restant de {{ candidat.soldeRestant | number }} FCFA.
          </div>
        }
        <!-- 360° SUMMARY CARDS -->
        <div class="stats-grid">
          <!-- Montant -->
          @if (canSeeFinancialData) {
            <div class="stat-card primary">
              <div class="stat-icon primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div class="stat-info">
                <div class="stat-label">Montant de la Formation</div>
                <div class="stat-value">{{ candidat.montantForfait | number }} <small>FCFA</small></div>
                <div class="stat-sub">{{ candidat.categoriePermisLibelle }} (Catégorie {{ candidat.categoriePermisCode }})</div>
              </div>
            </div>
          }
          <!-- Versé -->
          @if (canSeeFinancialData) {
            <div class="stat-card success">
              <div class="stat-icon success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              </div>
              <div class="stat-info">
                <div class="stat-label">Total Déjà Versé</div>
                <div class="stat-value">{{ candidat.totalVerse | number }} <small>FCFA</small></div>
                <div class="stat-sub text-success">Paiements validés</div>
              </div>
            </div>
          }
          <!-- Reste dû -->
          @if (canSeeFinancialData) {
            <div class="stat-card" [ngClass]="candidat.soldeRestant > 0 ? 'danger' : 'success'">
              <div class="stat-icon" [ngClass]="candidat.soldeRestant > 0 ? 'danger' : 'success'">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 7h5"/><path d="M17 7h-5"/><path d="M2 12l3-5 3 5a3 3 0 0 1-6 0Z"/><path d="M16 12l3-5 3 5a3 3 0 0 1-6 0Z"/></svg>
              </div>
              <div class="stat-info">
                <div class="stat-label">Solde Restant Dû</div>
                <div class="stat-value">{{ candidat.soldeRestant | number }} <small>FCFA</small></div>
                <div class="stat-sub">
                  <span class="badge" [ngClass]="candidat.soldeRestant === 0 ? 'badge-solde' : 'badge-expire-non-solde'">
                    {{ candidat.soldeRestant === 0 ? 'SOLDÉ' : 'NON SOLDÉ' }}
                  </span>
                </div>
              </div>
            </div>
          }
          <!-- Échéance -->
          <div class="stat-card info">
            <div class="stat-icon info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Validité Inscription</div>
              <div class="stat-value">{{ candidat.dateEcheance | date:'dd/MM/yyyy' }}</div>
              <div class="stat-sub">Inscrit le {{ candidat.dateInscription | date:'dd/MM/yyyy' }} (8 mois)</div>
            </div>
          </div>
        </div>
        <!-- TABS SECTION -->
        <div class="tabs-header">
          <button class="tab-btn" [class.active]="activeTab === 'dossier'" (click)="activeTab = 'dossier'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            Dossier Administratif
          </button>
          @if (canSeeFinancialData) {
            <button class="tab-btn" [class.active]="activeTab === 'paiements'" (click)="activeTab = 'paiements'">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              Historique des Versements ({{ paiements.length }})
            </button>
          }
          <button class="tab-btn" [class.active]="activeTab === 'examens'" (click)="activeTab = 'examens'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
            Suivi des Examens (Code, Créneau, Conduite)
          </button>
        </div>
        <!-- TAB 1 : DOSSIER ADMINISTRATIF -->
        @if (activeTab === 'dossier') {
          <div class="card tab-content">
            <div class="info-grid">
              <div class="info-group">
                <span class="info-label">Nom complet</span>
                <span class="info-value">{{ candidat.nom }} {{ candidat.prenom }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Date & Lieu de Naissance</span>
                <span class="info-value">{{ candidat.dateNaissance | date:'dd/MM/yyyy' }} à {{ candidat.lieuNaissance || 'Non spécifié' }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Téléphone</span>
                <span class="info-value" style="display:flex; align-items:center; gap:0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {{ candidat.telephone }}
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">Adresse Email</span>
                <span class="info-value">{{ candidat.email || 'Non renseigné' }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Contact(s) d'urgence</span>
                <span class="info-value">{{ candidat.contactsUrgence || 'Non renseigné' }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Catégorie de Permis</span>
                <span class="info-value badge badge-programme">{{ candidat.categoriePermisCode }} — {{ candidat.categoriePermisLibelle }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Site de Formation</span>
                <span class="info-value" style="display:flex; align-items:center; gap:0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="9" y1="12" x2="9" y2="12.01"/><line x1="9" y1="15" x2="9" y2="15.01"/><line x1="9" y1="18" x2="9" y2="18.01"/></svg>
                  {{ candidat.siteNom || 'Non spécifié' }}
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">Statut de l'Inscrit</span>
                <span class="info-value badge" [ngClass]="candidat.statutInscription === 'REDOUBLANT' ? 'badge-ajourne' : 'badge-solde'">
                  {{ candidat.statutInscription === 'REDOUBLANT' ? 'Redoublant' : 'Nouveau' }}
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">Date de Dépôt Dossier</span>
                <span class="info-value">{{ candidat.dateDepotDossier ? (candidat.dateDepotDossier | date:'dd/MM/yyyy') : 'En attente' }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Date de Réception Dossier</span>
                <span class="info-value">{{ candidat.dateReceptionDossier ? (candidat.dateReceptionDossier | date:'dd/MM/yyyy') : 'En attente' }}</span>
              </div>
            </div>
          </div>
        }
        <!-- TAB 2 : HISTORIQUE DES PAIEMENTS -->
        @if (canSeeFinancialData && activeTab === 'paiements') {
          <div class="card tab-content">
            <div class="card-header">
              <div class="card-title">Détail des Versements Enregistrés</div>
            </div>
            @if (paiements.length === 0) {
              <div class="empty-state">
                Aucun versement n'a encore été enregistré pour ce candidat.
              </div>
            }
            @if (paiements.length > 0) {
              <div class="table-responsive">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>N° Reçu</th>
                      <th>Date Paiement</th>
                      <th>Montant</th>
                      <th>Reste à payer</th>
                      <th>Mode Règlement</th>
                      <th>Encaissé par</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of paiements; track p) {
                      <tr>
                        <td><strong class="dossier-code">{{ p.numeroRecu || '-' }}</strong></td>
                        <td>{{ p.datePaiement | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td><strong class="text-success">{{ p.montant | number }} FCFA</strong></td>
                        <td><strong class="text-danger">{{ (p.soldeRestant || 0) | number }} FCFA</strong></td>
                        <td>{{ p.modeReglement }}</td>
                        <td>{{ p.utilisateurNomComplet }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
        <!-- TAB 3 : SUIVI DES EXAMENS -->
        @if (activeTab === 'examens') {
          <div class="card tab-content">
            <div class="card-header">
              <div class="card-title">Épreuves Pédagogiques (Jusqu'à 5 passages autorisés par épreuve)</div>
            </div>
            <div class="exam-grid">
              <!-- 1. CODE -->
              <div class="exam-card">
                <div class="exam-card-header">
                  <h4 style="display:flex; align-items:center; gap:0.45rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    1. Épreuve de CODE
                  </h4>
                  <span class="badge" [ngClass]="classeEtape(bilan?.codeReussi, 0)">
                    {{ statutEtape(bilan?.codeReussi, 0) }}
                  </span>
                </div>
                <div class="passage-list">
                  @if (!bilan?.passagesCode || bilan!.passagesCode.length === 0) {
                    <div class="no-passage">
                      Aucun passage enregistré
                    </div>
                  }
                  @for (pass of bilan?.passagesCode; track pass) {
                    <div class="passage-item">
                      <div>
                        <strong>Passage n°{{ pass.numeroPassage }}/5</strong> — {{ pass.datePassage | date:'dd/MM/yyyy' }}
                        @if (pass.observations) {
                          <div class="obs">{{ pass.observations }}</div>
                        }
                      </div>
                      <span class="badge" [ngClass]="getBadgeClass(pass.resultat)">{{ pass.resultat }}</span>
                    </div>
                  }
                </div>
              </div>
              <!-- 2. CRÉNEAU -->
              <div class="exam-card">
                <div class="exam-card-header">
                  <h4 style="display:flex; align-items:center; gap:0.45rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 16V8h4a3 3 0 0 1 0 6H9"/></svg>
                    2. Épreuve de CRÉNEAU
                  </h4>
                  <span class="badge" [ngClass]="classeEtape(bilan?.creneauReussi, 1)">
                    {{ statutEtape(bilan?.creneauReussi, 1) }}
                  </span>
                </div>
                <div class="passage-list">
                  @if (!bilan?.passagesCreneau || bilan!.passagesCreneau.length === 0) {
                    <div class="no-passage">
                      Aucun passage enregistré
                    </div>
                  }
                  @for (pass of bilan?.passagesCreneau; track pass) {
                    <div class="passage-item">
                      <div>
                        <strong>Passage n°{{ pass.numeroPassage }}/5</strong> — {{ pass.datePassage | date:'dd/MM/yyyy' }}
                        @if (pass.observations) {
                          <div class="obs">{{ pass.observations }}</div>
                        }
                      </div>
                      <span class="badge" [ngClass]="getBadgeClass(pass.resultat)">{{ pass.resultat }}</span>
                    </div>
                  }
                </div>
              </div>
              <!-- 3. CIRCULATION -->
              <div class="exam-card">
                <div class="exam-card-header">
                  <h4 style="display:flex; align-items:center; gap:0.45rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L19 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
                    3. Épreuve de CIRCULATION
                  </h4>
                  <span class="badge" [ngClass]="classeEtape(bilan?.circulationReussi, 2)">
                    {{ statutEtape(bilan?.circulationReussi, 2) }}
                  </span>
                </div>
                <div class="passage-list">
                  @if (!bilan?.passagesCirculation || bilan!.passagesCirculation.length === 0) {
                    <div class="no-passage">
                      Aucun passage enregistré
                    </div>
                  }
                  @for (pass of bilan?.passagesCirculation; track pass) {
                    <div class="passage-item">
                      <div>
                        <strong>Passage n°{{ pass.numeroPassage }}/5</strong> — {{ pass.datePassage | date:'dd/MM/yyyy' }}
                        @if (pass.observations) {
                          <div class="obs">{{ pass.observations }}</div>
                        }
                      </div>
                      <span class="badge" [ngClass]="getBadgeClass(pass.resultat)">{{ pass.resultat }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .header-action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .dossier-pill {
      display: inline-block;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-family: monospace;
      margin-top: 0.35rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tabs-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      /* Sur petit téléphone, 3 onglets avec libellés longs ne tiennent pas sur une seule
         ligne : on laisse défiler horizontalement plutôt que de les faire déborder de la page. */
      overflow-x: auto;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      white-space: nowrap;
      background: transparent;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-btn:hover {
      background: var(--bg-card);
      color: var(--text-main);
    }

    .tab-btn.active {
      background: var(--primary);
      color: white;
      box-shadow: var(--shadow-sm);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .info-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .exam-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .exam-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }

    .exam-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .exam-card-header h4 {
      font-size: 0.95rem;
    }

    .passage-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .passage-item {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.65rem 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .passage-item .obs {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
      margin-top: 0.15rem;
    }

    .no-passage {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-align: center;
      padding: 1rem;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
    }

    .text-right { text-align: right; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }
  `]
})
export class CandidatDetailComponent implements OnInit {
  candidatId!: number;
  candidat: Candidat | null = null;
  paiements: Paiement[] = [];
  bilan: BilanExamensCandidat | null = null;
  activeTab: 'dossier' | 'paiements' | 'examens' = 'dossier';

  showPaiementModal = false;
  savingPaiement = false;
  paiementError = '';
  newPaiement = {
    montant: 0,
    modeReglement: 'ESPECES'
  };

  showFraisExamenModal = false;
  savingFraisExamen = false;
  fraisExamenError = '';
  tarifsExamens: TarifsExamens | null = null;
  newFraisExamen = {
    typeEpreuve: 'CODE',
    montant: 0,
    modeReglement: 'ESPECES'
  };

  showExamenModal = false;
  savingExamen = false;
  examenError = '';
  newPassage = {
    typeEpreuve: 'CODE',
    datePassage: new Date().toISOString().substring(0, 10),
    resultat: 'PROGRAMME',
    observations: ''
  };

  resettingPassword = false;
  identifiantsCompteAAfficher: IdentifiantsCompte | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.candidatId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
  }

  get canAddPayment(): boolean {
    return this.authService.hasPermission(['PAIEMENTS_CREER']);
  }

  get canAddExam(): boolean {
    return this.authService.hasPermission(['EXAMENS_PROGRAMMER']);
  }

  get canResetPassword(): boolean {
    return this.authService.hasPermission(['UTILISATEURS_RESET_PASSWORD']);
  }

  get canPayFraisExamen(): boolean {
    return this.authService.hasPermission(['PAIEMENTS_CREER']) && !!this.candidat && !this.candidat.priseEnChargeExamens;
  }

  epreuveLabel(t?: string | null): string {
    if (t === 'CODE') return 'Code';
    if (t === 'CRENEAU') return 'Créneau';
    if (t === 'CIRCULATION') return 'Circulation';
    return t || '';
  }

  /** Index (0=CODE, 1=CRÉNEAU, 2=CIRCULATION) de la première épreuve non encore validée,
   *  dans l'ordre obligatoire du parcours ; -1 si les 3 épreuves sont validées. */
  get etapeCouranteIndex(): number {
    if (!this.bilan) return 0;
    if (!this.bilan.codeReussi) return 0;
    if (!this.bilan.creneauReussi) return 1;
    if (!this.bilan.circulationReussi) return 2;
    return -1;
  }

  statutEtape(reussi: boolean | undefined, index: number): string {
    if (reussi) return 'VALIDÉ';
    return index === this.etapeCouranteIndex ? 'EN COURS' : 'EN ATTENTE';
  }

  classeEtape(reussi: boolean | undefined, index: number): string {
    if (reussi) return 'badge-reussi';
    return index === this.etapeCouranteIndex ? 'badge-en-cours' : 'badge-attente';
  }

  get canSeeFinancialData(): boolean {
    return this.authService.hasPermission(['PAIEMENTS_VOIR']);
  }

  loadAll(): void {
    this.apiService.getCandidatById(this.candidatId).subscribe({
      next: (c) => this.candidat = c,
      error: (err) => console.error(err)
    });

    if (this.canSeeFinancialData) {
      this.apiService.getPaiementsByCandidat(this.candidatId).subscribe({
        next: (p) => this.paiements = p,
        error: (err) => console.error(err)
      });
    } else {
      this.paiements = [];
    }

    this.apiService.getBilanExamensCandidat(this.candidatId).subscribe({
      next: (b) => this.bilan = b,
      error: (err) => console.error(err)
    });
  }

  openPaiementModal(): void {
    this.paiementError = '';
    this.newPaiement = {
      montant: null as any,
      modeReglement: 'ESPECES'
    };
    this.showPaiementModal = true;
  }

  savePaiement(): void {
    if (!this.newPaiement.montant || this.newPaiement.montant <= 0) return;

    this.savingPaiement = true;
    this.paiementError = '';

    this.apiService.enregistrerPaiement({
      candidatId: this.candidatId,
      montant: this.newPaiement.montant,
      modeReglement: this.newPaiement.modeReglement
    }).subscribe({
      next: (res) => {
        this.savingPaiement = false;
        this.showPaiementModal = false;
        this.loadAll();
        if (res.recuId) {
          this.imprimerRecu(res.recuId);
        }
      },
      error: (err) => {
        this.savingPaiement = false;
        this.paiementError = extraireMessageErreur(err, 'Erreur lors de l’encaissement.');
      }
    });
  }

  openFraisExamenModal(): void {
    this.fraisExamenError = '';
    this.newFraisExamen = {
      typeEpreuve: 'CODE',
      montant: 0,
      modeReglement: 'ESPECES'
    };
    this.showFraisExamenModal = true;
    if (this.tarifsExamens) {
      this.appliquerTarifExamen();
    } else {
      this.apiService.getTarifsExamens().subscribe({
        next: (t) => {
          this.tarifsExamens = t;
          this.appliquerTarifExamen();
        },
        error: (err) => console.error(err)
      });
    }
  }

  onFraisExamenTypeChange(): void {
    this.appliquerTarifExamen();
  }

  private appliquerTarifExamen(): void {
    if (!this.tarifsExamens) return;
    const tarifs: Record<string, number> = {
      CODE: this.tarifsExamens.prixExamenCode,
      CRENEAU: this.tarifsExamens.prixExamenCreneau,
      CIRCULATION: this.tarifsExamens.prixExamenCirculation
    };
    this.newFraisExamen.montant = tarifs[this.newFraisExamen.typeEpreuve] || 0;
  }

  saveFraisExamen(): void {
    if (!this.newFraisExamen.montant || this.newFraisExamen.montant <= 0) return;

    this.savingFraisExamen = true;
    this.fraisExamenError = '';

    this.apiService.enregistrerFraisExamen({
      candidatId: this.candidatId,
      typeEpreuve: this.newFraisExamen.typeEpreuve,
      montant: this.newFraisExamen.montant,
      modeReglement: this.newFraisExamen.modeReglement
    }).subscribe({
      next: (res) => {
        this.savingFraisExamen = false;
        this.showFraisExamenModal = false;
        this.loadAll();
        if (res.recuId) {
          this.imprimerRecu(res.recuId);
        }
      },
      error: (err) => {
        this.savingFraisExamen = false;
        this.fraisExamenError = extraireMessageErreur(err, 'Erreur lors de l’encaissement des frais d’examen.');
      }
    });
  }

  resetPassword(): void {
    if (!confirm('Réinitialiser le mot de passe de cet inscrit ? Son ancien mot de passe cessera immédiatement de fonctionner.')) {
      return;
    }
    this.resettingPassword = true;
    this.apiService.resetPasswordCandidat(this.candidatId).subscribe({
      next: (identifiants) => {
        this.resettingPassword = false;
        this.identifiantsCompteAAfficher = identifiants;
      },
      error: (err) => {
        this.resettingPassword = false;
        alert(extraireMessageErreur(err, 'Erreur lors de la réinitialisation du mot de passe.'));
      }
    });
  }

  openExamenModal(): void {
    this.examenError = '';
    this.newPassage = {
      typeEpreuve: 'CODE',
      datePassage: new Date().toISOString().substring(0, 10),
      resultat: 'PROGRAMME',
      observations: ''
    };
    this.showExamenModal = true;
  }

  saveExamen(): void {
    this.savingExamen = true;
    this.examenError = '';

    this.apiService.programmerPassage({
      candidatId: this.candidatId,
      ...this.newPassage
    }).subscribe({
      next: () => {
        this.savingExamen = false;
        this.showExamenModal = false;
        this.loadAll();
      },
      error: (err) => {
        this.savingExamen = false;
        this.examenError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement de l’examen.');
      }
    });
  }

  imprimerReleve(): void {
    this.apiService.downloadBlob(
      this.apiService.getRelevePaiementPdfUrl(this.candidatId),
      `releve_paiement_${this.candidat?.numeroDossier}.pdf`
    );
  }

  imprimerReleveDirectement(): void {
    this.apiService.printBlob(this.apiService.getRelevePaiementPdfUrl(this.candidatId));
  }

  imprimerRecu(recuId: number): void {
    this.apiService.downloadBlob(
      this.apiService.getRecuPdfUrl(recuId),
      `recu_paiement_${recuId}.pdf`
    );
  }

  imprimerDirectement(recuId: number): void {
    this.apiService.printBlob(this.apiService.getRecuPdfUrl(recuId));
  }

  getBadgeClass(res: string): string {
    switch (res) {
      case 'REUSSI': return 'badge-reussi';
      case 'AJOURNE': return 'badge-ajourne';
      default: return 'badge-programme';
    }
  }
}
