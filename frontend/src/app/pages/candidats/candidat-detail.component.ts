import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Candidat,
  Paiement,
  PassageExamen,
  BilanExamensCandidat,
  Recu
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
            <a routerLink="/candidats" class="btn btn-outline btn-sm">◀ Retour aux candidats</a>
            <h2>Fiche Candidat : {{ candidat.nom }} {{ candidat.prenom }}</h2>
            <span class="dossier-pill">N° Dossier : {{ candidat.numeroDossier }}</span>
          </div>
          <div class="action-buttons">
            @if (canSeeFinancialData) {
              <button class="btn btn-outline btn-sm" (click)="imprimerReleve()">
                📑 Télécharger Relevé Financier PDF
              </button>
            }
            @if (canAddPayment && candidat.soldeRestant > 0) {
              <button class="btn btn-success" (click)="openPaiementModal()">
                💵 Encaisser un Versement
              </button>
            }
            @if (canAddExam) {
              <button class="btn btn-primary" (click)="openExamenModal()">
                🎓 Enregistrer un Examen
              </button>
            }
          </div>
        </div>
        <!-- ALERTE EXPIRATION SI APPLICABLE -->
        @if (candidat.procheExpiration) {
          <div class="alert alert-warning">
            ⚠️ <strong>Attention :</strong> Ce dossier expire dans <strong>{{ candidat.joursRestants }} jours</strong> (le {{ candidat.dateEcheance | date:'dd/MM/yyyy' }}).
          </div>
        }
        @if (canSeeFinancialData && candidat.statutDossier === 'EXPIRE_NON_SOLDE') {
          <div class="alert alert-danger">
            ⛔ <strong>Dossier Expiré non soldé :</strong> La période de validité de 8 mois est échue avec un solde restant de {{ candidat.soldeRestant | number }} FCFA.
          </div>
        }
        <!-- 360° SUMMARY CARDS -->
        <div class="stats-grid">
          <!-- Montant -->
          @if (canSeeFinancialData) {
            <div class="stat-card primary">
              <div class="stat-icon primary">📄</div>
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
              <div class="stat-icon success">💳</div>
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
              <div class="stat-icon" [ngClass]="candidat.soldeRestant > 0 ? 'danger' : 'success'">⚖️</div>
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
            <div class="stat-icon info">⏳</div>
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
            📋 Dossier Administratif
          </button>
          @if (canSeeFinancialData) {
            <button class="tab-btn" [class.active]="activeTab === 'paiements'" (click)="activeTab = 'paiements'">
              💰 Historique des Versements ({{ paiements.length }})
            </button>
          }
          <button class="tab-btn" [class.active]="activeTab === 'examens'" (click)="activeTab = 'examens'">
            🎓 Suivi des Examens (Code, Créneau, Conduite)
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
                <span class="info-value">📞 {{ candidat.telephone }}</span>
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
                <span class="info-value">🏢 {{ candidat.siteNom || 'Non spécifié' }}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Statut du Candidat</span>
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
              @if (canAddPayment && candidat.soldeRestant > 0) {
                <button class="btn btn-success btn-sm" (click)="openPaiementModal()">
                  ➕ Nouveau Versement
                </button>
              }
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
                      <th>Type de Versement</th>
                      <th>Montant</th>
                      <th>Mode Règlement</th>
                      <th>Encaissé par</th>
                      <th>Statut</th>
                      <th class="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of paiements; track p) {
                      <tr>
                        <td><strong class="dossier-code">{{ p.numeroRecu || '-' }}</strong></td>
                        <td>{{ p.datePaiement | date:'dd/MM/yyyy HH:mm' }}</td>
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
                        </td>
                        <td class="text-right">
                          @if (p.recuId) {
                            <button class="btn btn-outline btn-sm" (click)="imprimerRecu(p.recuId)" title="Imprimer reçu PDF">
                              🖨️ Reçu PDF
                            </button>
                          }
                        </td>
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
              @if (canAddExam) {
                <button class="btn btn-primary btn-sm" (click)="openExamenModal()">
                  ➕ Nouveau Passage
                </button>
              }
            </div>
            <div class="exam-grid">
              <!-- 1. CODE -->
              <div class="exam-card">
                <div class="exam-card-header">
                  <h4>📖 1. Épreuve de CODE</h4>
                  <span class="badge" [ngClass]="bilan?.codeReussi ? 'badge-reussi' : 'badge-programme'">
                    {{ bilan?.codeReussi ? 'VALIDÉ ✅' : 'EN COURS' }}
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
                  <h4>🅿️ 2. Épreuve de CRÉNEAU</h4>
                  <span class="badge" [ngClass]="bilan?.creneauReussi ? 'badge-reussi' : 'badge-programme'">
                    {{ bilan?.creneauReussi ? 'VALIDÉ ✅' : 'EN COURS' }}
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
                  <h4>🚗 3. Épreuve de CIRCULATION</h4>
                  <span class="badge" [ngClass]="bilan?.circulationReussi ? 'badge-reussi' : 'badge-programme'">
                    {{ bilan?.circulationReussi ? 'VALIDÉ ✅' : 'EN COURS' }}
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
        <!-- MODAL VERSEMENT -->
        @if (showPaiementModal) {
          <div class="modal-backdrop">
            <div class="modal-content">
              <div class="modal-header">
                <h3>💵 Enregistrer un Versement</h3>
                <button class="btn btn-outline btn-sm" (click)="showPaiementModal = false">✕</button>
              </div>
              <form (ngSubmit)="savePaiement()">
                <div class="modal-body">
                  @if (paiementError) {
                    <div class="alert alert-danger">⚠️ {{ paiementError }}</div>
                  }
                  <div class="alert alert-info">
                    Solde actuel restant dû : <strong>{{ candidat.soldeRestant | number }} FCFA</strong>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Montant du versement (FCFA) <span class="required">*</span></label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="newPaiement.montant"
                      name="montant"
                      [max]="candidat.soldeRestant"
                      required
                      placeholder="Ex: 25000"
                      />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Mode de règlement <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newPaiement.modeReglement" name="modeReglement" required>
                      <option value="ESPECES">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile Money (Wave / Orange / MTN / Moov)</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="CHEQUE">Chèque</option>
                    </select>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" (click)="showPaiementModal = false">Annuler</button>
                  <button type="submit" class="btn btn-success" [disabled]="savingPaiement || !newPaiement.montant">
                    {{ savingPaiement ? 'Validation...' : 'Valider & Émettre le Reçu' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
        <!-- MODAL EXAMEN -->
        @if (showExamenModal) {
          <div class="modal-backdrop">
            <div class="modal-content">
              <div class="modal-header">
                <h3>🎓 Programmer / Enregistrer un Examen</h3>
                <button class="btn btn-outline btn-sm" (click)="showExamenModal = false">✕</button>
              </div>
              <form (ngSubmit)="saveExamen()">
                <div class="modal-body">
                  @if (examenError) {
                    <div class="alert alert-danger">⚠️ {{ examenError }}</div>
                  }
                  <div class="form-group">
                    <label class="form-label">Type d'épreuve <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newPassage.typeEpreuve" name="typeEpreuve" required>
                      <option value="CODE">1. Code de la route</option>
                      <option value="CRENEAU">2. Manœuvre / Créneau</option>
                      <option value="CIRCULATION">3. Conduite en circulation</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date du passage <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="newPassage.datePassage" name="datePassage" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Résultat <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newPassage.resultat" name="resultat" required>
                      <option value="PROGRAMME">PROGRAMMÉ (En attente)</option>
                      <option value="REUSSI">RÉUSSI (Admis)</option>
                      <option value="AJOURNE">AJOURNÉ</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Observations / Notes du moniteur</label>
                    <textarea class="form-control" rows="3" [(ngModel)]="newPassage.observations" name="observations" placeholder="Remarques pédagogiques, fautes éventuelles..."></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" (click)="showExamenModal = false">Annuler</button>
                  <button type="submit" class="btn btn-primary" [disabled]="savingExamen">
                    {{ savingExamen ? 'Enregistrement...' : 'Enregistrer le Passage' }}
                  </button>
                </div>
              </form>
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
    }

    .tab-btn {
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

  showExamenModal = false;
  savingExamen = false;
  examenError = '';
  newPassage = {
    typeEpreuve: 'CODE',
    datePassage: new Date().toISOString().substring(0, 10),
    resultat: 'PROGRAMME',
    observations: ''
  };

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
    return this.authService.hasRole(['ADMIN', 'CAISSIERE']);
  }

  get canAddExam(): boolean {
    return this.authService.hasRole(['ADMIN', 'MONITEUR']);
  }

  get canSeeFinancialData(): boolean {
    return this.authService.hasRole(['ADMIN', 'SECRETAIRE', 'CAISSIERE']);
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
      montant: this.candidat?.soldeRestant || 0,
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

  imprimerRecu(recuId: number): void {
    this.apiService.downloadBlob(
      this.apiService.getRecuPdfUrl(recuId),
      `recu_paiement_${recuId}.pdf`
    );
  }

  getBadgeClass(res: string): string {
    switch (res) {
      case 'REUSSI': return 'badge-reussi';
      case 'AJOURNE': return 'badge-ajourne';
      default: return 'badge-programme';
    }
  }
}
