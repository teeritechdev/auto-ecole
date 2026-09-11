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
          <p>Épreuves de Code, Créneau et Circulation (Jusqu'à 5 passages par épreuve)</p>
        </div>
        <div class="header-buttons">
          @if (canAdd) {
            <button class="btn btn-primary" (click)="openProgrammerModal()">
              ➕ Programmer un Examen
            </button>
          }
        </div>
      </div>

      <!-- FILTRE -->
      <div class="card filter-card">
        <div class="filter-grid">
          @if (!isMoniteurRole || sitesAutorises.length > 1) {
            <div>
              <select class="form-control" [(ngModel)]="sessionFiltreSite">
                <option value="">Tous les sites</option>
                @for (s of sitesAutorises; track s.id) {
                  <option [value]="s.id">{{ s.nom }}</option>
                }
              </select>
            </div>
          }
          <div>
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
          <div>
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
                <th>Date</th>
                <th>Épreuve</th>
                <th>Moniteur</th>
                <th>Candidats</th>
                <th>Statut</th>
                <th class="text-right">Action</th>
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
                  <span class="badge" [ngClass]="{
                    'badge-programme': s.typeEpreuve === 'CODE',
                    'badge-solde': s.typeEpreuve === 'CRENEAU',
                    'badge-en-cours': s.typeEpreuve === 'CIRCULATION'
                  }">{{ s.typeEpreuve }}</span>
                  </td>
                  <td>{{ s.moniteurNomComplet || 'Non affecté' }}</td>
                  <td>{{ s.candidats.length }}</td>
                  <td>
                    <span class="badge" [ngClass]="s.terminee ? 'badge-reussi' : 'badge-programme'">
                      {{ s.terminee ? 'Terminé' : 'En cours' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button class="btn btn-outline btn-sm" (click)="openSessionDetail(s.id)">Voir</button>
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
          <div class="modal-content">
            <div class="modal-header">
              <h3>Session du {{ sessionDetail.datePassage | date:'dd/MM/yyyy' }} — {{ epreuveLabel(sessionDetail.typeEpreuve) }}</h3>
              <button class="btn btn-outline btn-sm" (click)="closeSessionModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (sessionError) {
                <div class="alert alert-danger">⚠️ {{ sessionError }}</div>
              }
              <div class="alert alert-info session-info">
                <div class="session-info-text">
                  <div>Site : <strong>{{ sessionDetail.siteNom || 'Non défini' }}</strong></div>
                  <div>
                    Moniteur : <strong>{{ sessionDetail.moniteurNomComplet || 'Non affecté' }}</strong>
                    @if (sessionDetail.moniteurSpecialites?.length) {
                      <span class="sub-text"> ({{ formatSpecialites(sessionDetail.moniteurSpecialites) }})</span>
                    }
                  </div>
                  <div>{{ sessionDetail.datePassee ? 'Date passée' : 'À venir' }}</div>
                </div>
                @if (peutGererSession(sessionDetail)) {
                  @if (!editingSessionDate) {
                    <button class="btn btn-outline btn-sm" (click)="startEditSessionDate()">✏️ Modifier la date</button>
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
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Candidat</th>
                    <th>Résultat</th>
                    <th>Tentatives</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (sessionDetail.candidats.length === 0) {
                    <tr><td colspan="4" class="text-center py-4">Aucun candidat dans cette session.</td></tr>
                  }
                  @for (p of sessionDetail.candidats; track p.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/candidats', p.candidatId]" class="candidat-link"><strong>{{ p.candidatNomComplet }}</strong></a>
                        <div class="sub-text">{{ p.candidatNumeroDossier }}</div>
                      </td>
                      <td><span class="badge" [ngClass]="getBadgeClass(p.resultat)">{{ p.resultat }}</span></td>
                      <td>{{ p.nombreEchecs }}/5</td>
                      <td class="text-right">
                        @if (peutNoter(sessionDetail)) {
                          <button class="btn btn-outline btn-sm" (click)="openUpdateModal(p)">✏️ Noter</button>
                        }
                        @if (peutRetirer(sessionDetail)) {
                          <button class="btn btn-danger btn-sm" style="margin-left: 0.25rem" (click)="retirerDeSession(p.id)">🗑️</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              @if (peutRetirer(sessionDetail)) {
                <div style="margin-top: 1.25rem;">
                  @if (!showAjoutCandidats) {
                    <button class="btn btn-secondary btn-sm" (click)="openAjoutCandidats()">➕ Ajouter des candidats</button>
                  } @else {
                    <div class="form-group">
                      <label class="form-label">Candidats éligibles pour cette épreuve</label>
                      <div class="candidats-list">
                        @for (c of candidatsAjoutables; track c.id) {
                          <label class="candidat-option">
                            <input type="checkbox" [checked]="isAjoutSelected(c.id)" (change)="toggleAjoutCandidat(c.id)" />
                            <span class="candidat-option-text">
                              <strong>{{ c.numeroDossier }}</strong>
                              <span>{{ c.nom }} {{ c.prenom }} ({{ c.categoriePermisCode }})</span>
                            </span>
                          </label>
                        }
                        @if (candidatsAjoutables.length === 0) {
                          <div class="form-help" style="padding: 0.7rem;">Aucun candidat supplémentaire éligible.</div>
                        }
                      </div>
                      <div class="modal-footer" style="padding: 0.75rem 0 0; border-top: none;">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="showAjoutCandidats = false">Annuler</button>
                        <button type="button" class="btn btn-primary btn-sm" [disabled]="ajoutSelectionIds.length === 0 || savingAjout" (click)="confirmerAjout()">
                          {{ savingAjout ? 'Ajout...' : 'Ajouter (' + ajoutSelectionIds.length + ')' }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL PROGRAMMER EXAMEN -->
      @if (showProgrammerModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>🎓 Programmer une Session d'Examen</h3>
              <button class="btn btn-outline btn-sm" (click)="showProgrammerModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveProgrammer()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">⚠️ {{ formError }}</div>
                }
                @if (currentWizardStep === 'site') {
                  <div class="step-indicator">Étape {{ programmerStepIndex + 1 }} sur {{ wizardSteps.length }}</div>
                  <div class="form-group">
                    <label class="form-label">Choisir le site <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newPassage.siteId" name="siteId" (change)="onSiteChange()" required>
                      <option [ngValue]="null" disabled>Sélectionner un site</option>
                      @for (s of sitesAutorises; track s.id) {
                        <option [ngValue]="s.id">{{ s.nom }}</option>
                      }
                    </select>
                  </div>
                  <p class="form-help">Le site sera appliqué à tous les candidats sélectionnés (ils doivent y être inscrits).</p>
                } @else if (currentWizardStep === 'epreuve') {
                  <div class="step-indicator">Étape {{ programmerStepIndex + 1 }} sur {{ wizardSteps.length }}</div>
                  <div class="form-group">
                    <label class="form-label">Choisir l'épreuve à programmer <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="newPassage.typeEpreuve" name="typeEpreuve" (change)="onTypeEpreuveChange()" required>
                      @for (t of epreuvesAutorisees; track t) {
                        <option [value]="t">{{ epreuveLabel(t) }}</option>
                      }
                    </select>
                  </div>
                  <p class="form-help">Le type d'épreuve sera appliqué à tous les candidats sélectionnés à l'étape suivante.</p>
                } @else {
                  <div class="step-indicator">
                    {{ wizardSteps.length > 1 ? 'Étape ' + wizardSteps.length + ' sur ' + wizardSteps.length + ' · ' : '' }}{{ epreuveLabel(newPassage.typeEpreuve) }}
                  </div>
                  <div class="form-group">
                    <label class="form-label">Candidats <span class="required">*</span></label>
                    <div class="candidats-list">
                      @for (c of eligibleCandidats; track c) {
                        <label class="candidat-option">
                          <input
                            type="checkbox"
                            [checked]="isCandidatSelected(c.id)"
                            (change)="toggleCandidat(c.id)"
                            />
                          <span class="candidat-option-text">
                            <strong>{{ c.numeroDossier }}</strong>
                            <span>{{ c.nom }} {{ c.prenom }} ({{ c.categoriePermisCode }})</span>
                          </span>
                        </label>
                      }
                    </div>
                    @if (eligibleCandidats.length === 0) {
                      <div class="form-help">
                        Aucun candidat n'est actuellement éligible pour cette épreuve{{ newPassage.siteId ? ' sur ce site' : '' }}.
                      </div>
                    }
                    <div class="form-help">Cochez les candidats concernés par cette programmation.</div>
                    @if (selectedCandidatIds.length > 0) {
                      <div class="selection-count">
                        {{ selectedCandidatIds.length }} candidat(s) sélectionné(s)
                      </div>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date du passage <span class="required">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="newPassage.datePassage" name="datePassage" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Résultat initial</label>
                    <select class="form-control" [(ngModel)]="newPassage.resultat" name="resultat">
                      <option value="PROGRAMME">PROGRAMMÉ (En attente)</option>
                      <option value="REUSSI">RÉUSSI (Admis)</option>
                      <option value="AJOURNE">AJOURNÉ</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Observations</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="newPassage.observations" name="observations" placeholder="Remarques éventuelles..."></textarea>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showProgrammerModal = false">Annuler</button>
                @if (programmerStepIndex > 0) {
                  <button type="button" class="btn btn-secondary" (click)="programmerStepIndex = programmerStepIndex - 1" [disabled]="saving">Retour</button>
                }
                @if (programmerStepIndex < wizardSteps.length - 1) {
                  <button type="button" class="btn btn-primary" [disabled]="currentWizardStep === 'site' && !newPassage.siteId" (click)="programmerStepIndex = programmerStepIndex + 1">Continuer</button>
                }
                @if (programmerStepIndex === wizardSteps.length - 1) {
                  <button type="submit" class="btn btn-primary" [disabled]="saving || selectedCandidatIds.length === 0 || !newPassage.datePassage">
                    {{ saving ? 'Enregistrement...' : 'Confirmer la Programmation' }}
                  </button>
                }
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
              <h3>✏️ Saisir / Mettre à jour le Résultat</h3>
              <button class="btn btn-outline btn-sm" (click)="showUpdateModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveUpdateResultat()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">⚠️ {{ formError }}</div>
                }
                <div class="alert alert-info">
                  Candidat : <strong>{{ targetPassage?.candidatNomComplet }}</strong><br>
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
                  {{ saving ? 'Mise à jour...' : 'Enregistrer la Décision' }}
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
      gap: 0.5rem;
    }

    .edit-date-row .form-control {
      width: auto;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 0.5fr;
      gap: 1rem;
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
  `]
})
export class ExamensComponent implements OnInit {
  allCandidats: Candidat[] = [];
  eligibleCandidats: Candidat[] = [];
  allExamens: PassageExamen[] = [];
  saving = false;

  sessions: SessionExamen[] = [];
  loadingSessions = false;
  sessionFiltreEpreuve = '';
  sessionFiltreSite = '';
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
  updateData: any = {
    datePassage: '',
    resultat: '',
    observations: ''
  };

  formError = '';

  editingSessionDate = false;
  editSessionDateValue = '';
  savingSessionDate = false;

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

  get sessionsAffichees(): SessionExamen[] {
    return this.sessions
      .filter(s => !this.sessionFiltreEpreuve || s.typeEpreuve === this.sessionFiltreEpreuve)
      .filter(s => !this.sessionFiltreSite || String(s.siteId) === this.sessionFiltreSite);
  }

  reinitialiserFiltres(): void {
    this.sessionFiltreEpreuve = '';
    this.sessionFiltreSite = '';
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
    this.apiService.getSessionDetail(id).subscribe({
      next: (data) => {
        this.sessionDetail = data;
        this.showSessionModal = true;
      },
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors du chargement de la session.'))
    });
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
    this.sessionDetail = null;
    this.showAjoutCandidats = false;
  }

  /** Le retrait n'est possible qu'avant la date pour un moniteur ; sans restriction pour l'admin. */
  peutRetirer(s: SessionExamen): boolean {
    return this.isAdmin || !s.datePassee;
  }

  /** Noter un résultat n'a de sens qu'une fois la date de l'examen arrivée, pour tous les rôles. */
  peutNoter(s: SessionExamen): boolean {
    return s.datePassee;
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
    const idsExistants = new Set(this.sessionDetail.candidats.map(p => p.candidatId));
    this.candidatsAjoutables = this.allCandidats.filter(c =>
      !idsExistants.has(c.id) && this.estEligiblePour(c, this.sessionDetail!.typeEpreuve, this.sessionDetail!.siteId ?? null)
    );
    this.showAjoutCandidats = true;
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

  /** Sites sur lesquels l'utilisateur courant peut consulter/programmer : limités à
   *  ses sites d'affectation pour un moniteur, tous les sites pour les autres rôles. */
  get sitesAutorises(): Site[] {
    const user = this.authService.currentUserValue;
    if (user?.role === 'MONITEUR') {
      return this.sites.filter(s => user.siteIds?.includes(s.id));
    }
    return this.sites;
  }

  /** Seul le moniteur programme des examens : l'administrateur se contente de
   *  valider ou retirer ce que les moniteurs ont proposé (cf. section dédiée). */
  get canAdd(): boolean {
    const user = this.authService.currentUserValue;
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
    if (this.selectedCandidatIds.length === 0) return;

    this.saving = true;
    this.formError = '';

    const payload = {
      candidatIds: this.selectedCandidatIds,
      typeEpreuve: this.newPassage.typeEpreuve,
      siteId: this.newPassage.siteId,
      datePassage: this.newPassage.datePassage,
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

  getBadgeClass(res: string): string {
    switch (res) {
      case 'REUSSI': return 'badge-reussi';
      case 'AJOURNE': return 'badge-ajourne';
      default: return 'badge-programme';
    }
  }
}
