import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, PassageExamen } from '../../core/models/models';
import { forkJoin } from 'rxjs';

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
          <button class="btn btn-primary" *ngIf="canAdd" (click)="openProgrammerModal()">
            ➕ Programmer un Examen
          </button>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div>
            <select class="form-control" [(ngModel)]="epreuveFiltre" (change)="loadPassages()">
              <option value="">Toutes les épreuves</option>
              <option value="CODE">1. Code de la route</option>
              <option value="CRENEAU">2. Manœuvre / Créneau</option>
              <option value="CIRCULATION">3. Conduite en circulation</option>
            </select>
          </div>

          <div>
            <select class="form-control" [(ngModel)]="resultatFiltre" (change)="loadPassages()">
              <option value="">Tous les résultats</option>
              <option value="PROGRAMME">PROGRAMMÉ</option>
              <option value="REUSSI">RÉUSSI (Admis)</option>
              <option value="ECHEC">ÉCHEC</option>
              <option value="AJOURNE">AJOURNÉ</option>
            </select>
          </div>

          <div>
            <button class="btn btn-secondary" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>

      <!-- EXAM TABLE -->
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date Examen</th>
                <th>Candidat</th>
                <th>Épreuve</th>
                <th>Tentative</th>
                <th>Résultat</th>
                <th>Moniteur</th>
                <th>Observations</th>
                <th class="text-right" *ngIf="canAdd">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="8" class="text-center py-4">Chargement des sessions d'examens...</td>
              </tr>
              <tr *ngIf="!loading && passages.length === 0">
                <td colspan="8" class="text-center py-4">Aucune session d'examen trouvée.</td>
              </tr>
              <tr *ngFor="let p of passages">
                <td><strong>{{ p.datePassage | date:'dd/MM/yyyy' }}</strong></td>
                <td>
                  <a [routerLink]="['/candidats', p.candidatId]" class="candidat-link">
                    <strong>{{ p.candidatNomComplet }}</strong>
                  </a>
                  <div class="sub-text">{{ p.candidatNumeroDossier }}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-programme': p.typeEpreuve === 'CODE',
                    'badge-solde': p.typeEpreuve === 'CRENEAU',
                    'badge-en-cours': p.typeEpreuve === 'CIRCULATION'
                  }">{{ p.typeEpreuve }}</span>
                </td>
                <td>
                  <strong>Passage {{ p.numeroPassage }}/5</strong>
                </td>
                <td>
                  <span class="badge" [ngClass]="getBadgeClass(p.resultat)">
                    {{ p.resultat }}
                  </span>
                </td>
                <td>{{ p.moniteurNomComplet || 'Non affecté' }}</td>
                <td>
                  <span class="obs-text">{{ p.observations || '—' }}</span>
                </td>
                <td class="text-right" *ngIf="canAdd">
                  <button class="btn btn-outline btn-sm" (click)="openUpdateModal(p)">
                    ✏️ Noter
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-bar" *ngIf="totalPages > 1">
          <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changePage(page - 1)">◀ Précédent</button>
          <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} passages)</span>
          <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">Suivant ▶</button>
        </div>
      </div>

      <!-- MODAL PROGRAMMER EXAMEN -->
      <div class="modal-backdrop" *ngIf="showProgrammerModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🎓 Programmer une Session d'Examen</h3>
            <button class="btn btn-outline btn-sm" (click)="showProgrammerModal = false">✕</button>
          </div>
          <form (ngSubmit)="saveProgrammer()">
            <div class="modal-body">
              <div *ngIf="formError" class="alert alert-danger">⚠️ {{ formError }}</div>

              <ng-container *ngIf="programmerStep === 1; else programmerDetails">
                <div class="step-indicator">Étape 1 sur 2</div>
                <div class="form-group">
                  <label class="form-label">Choisir l'épreuve à programmer <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="newPassage.typeEpreuve" name="typeEpreuve" (change)="onTypeEpreuveChange()" required>
                    <option value="CODE">1. Code de la route</option>
                    <option value="CRENEAU">2. Manœuvre / Créneau</option>
                    <option value="CIRCULATION">3. Conduite en circulation</option>
                  </select>
                </div>
                <p class="form-help">Le type d'épreuve sera appliqué à tous les candidats sélectionnés à l'étape suivante.</p>
              </ng-container>

              <ng-template #programmerDetails>
                <div class="step-indicator">Étape 2 sur 2 · {{ newPassage.typeEpreuve }}</div>
                <div class="form-group">
                  <label class="form-label">Candidats <span class="required">*</span></label>
                  <div class="candidats-list">
                    <label class="candidat-option" *ngFor="let c of eligibleCandidats">
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
                  </div>
                  <div class="form-help" *ngIf="eligibleCandidats.length === 0">
                    Aucun candidat n'est actuellement éligible pour cette épreuve.
                  </div>
                  <div class="form-help">Cochez les candidats concernés par cette programmation.</div>
                  <div class="selection-count" *ngIf="selectedCandidatIds.length > 0">
                    {{ selectedCandidatIds.length }} candidat(s) sélectionné(s)
                  </div>
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
                    <option value="ECHEC">ÉCHEC</option>
                    <option value="AJOURNE">AJOURNÉ</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Observations</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="newPassage.observations" name="observations" placeholder="Remarques éventuelles..."></textarea>
                </div>
              </ng-template>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showProgrammerModal = false">Annuler</button>
              <button *ngIf="programmerStep === 2" type="button" class="btn btn-secondary" (click)="programmerStep = 1" [disabled]="saving">Retour</button>
              <button *ngIf="programmerStep === 1" type="button" class="btn btn-primary" (click)="programmerStep = 2">Continuer</button>
              <button *ngIf="programmerStep === 2" type="submit" class="btn btn-primary" [disabled]="saving || selectedCandidatIds.length === 0 || !newPassage.datePassage">
                {{ saving ? 'Enregistrement...' : 'Confirmer la Programmation' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL MAJ RÉSULTAT -->
      <div class="modal-backdrop" *ngIf="showUpdateModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>✏️ Saisir / Mettre à jour le Résultat</h3>
            <button class="btn btn-outline btn-sm" (click)="showUpdateModal = false">✕</button>
          </div>
          <form (ngSubmit)="saveUpdateResultat()">
            <div class="modal-body">
              <div *ngIf="formError" class="alert alert-danger">⚠️ {{ formError }}</div>

              <div class="alert alert-info">
                Candidat : <strong>{{ targetPassage?.candidatNomComplet }}</strong><br>
                Épreuve : <strong>{{ targetPassage?.typeEpreuve }}</strong> (Passage {{ targetPassage?.numeroPassage }}/5)
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
                  <option value="ECHEC">ÉCHEC</option>
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
  passages: PassageExamen[] = [];
  allCandidats: Candidat[] = [];
  eligibleCandidats: Candidat[] = [];
  allExamens: PassageExamen[] = [];
  loading = false;
  saving = false;

  epreuveFiltre = '';
  resultatFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  showProgrammerModal = false;
  programmerStep = 1;
  selectedCandidatIds: number[] = [];
  newPassage: any = {
    typeEpreuve: 'CODE',
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

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadPassages();
    this.loadCandidats();
  }

  get canAdd(): boolean {
    return this.authService.hasRole(['ADMIN', 'MONITEUR']);
  }

  loadPassages(): void {
    this.loading = true;
    this.apiService.getPassages(undefined, this.epreuveFiltre, this.resultatFiltre, this.page).subscribe({
      next: (res) => {
        this.passages = res.content || [];
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

  changePage(p: number): void {
    this.page = p;
    this.loadPassages();
  }

  resetFiltres(): void {
    this.epreuveFiltre = '';
    this.resultatFiltre = '';
    this.page = 0;
    this.loadPassages();
  }

  openProgrammerModal(): void {
    this.formError = '';
    this.programmerStep = 1;
    this.selectedCandidatIds = [];
    this.newPassage = {
      typeEpreuve: 'CODE',
      datePassage: new Date().toISOString().substring(0, 10),
      resultat: 'PROGRAMME',
      observations: ''
    };
    this.showProgrammerModal = true;
  }

  onTypeEpreuveChange(): void {
    this.selectedCandidatIds = [];
    this.updateEligibleCandidats();
  }

  private updateEligibleCandidats(): void {
    this.eligibleCandidats = this.allCandidats.filter(candidat => {
      if (candidat.statutDossier === 'EXPIRE' || candidat.statutDossier === 'EXPIRE_NON_SOLDE') {
        return false;
      }

      const examensCandidat = this.allExamens.filter(examen => examen.candidatId === candidat.id);
      const code = examensCandidat.filter(examen => examen.typeEpreuve === 'CODE');
      const creneau = examensCandidat.filter(examen => examen.typeEpreuve === 'CRENEAU');
      const circulation = examensCandidat.filter(examen => examen.typeEpreuve === 'CIRCULATION');

      if (this.newPassage.typeEpreuve === 'CODE') {
        return !code.some(examen => examen.resultat === 'REUSSI' || examen.resultat === 'PROGRAMME') && code.length < 5;
      }

      if (this.newPassage.typeEpreuve === 'CRENEAU') {
        return code.some(examen => examen.resultat === 'REUSSI')
          && !creneau.some(examen => examen.resultat === 'REUSSI' || examen.resultat === 'PROGRAMME')
          && creneau.length < 5;
      }

      return creneau.some(examen => examen.resultat === 'REUSSI')
        && !circulation.some(examen => examen.resultat === 'REUSSI' || examen.resultat === 'PROGRAMME')
        && circulation.length < 5;
    });
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

    const requests = this.selectedCandidatIds.map(candidatId =>
      this.apiService.programmerPassage({ ...this.newPassage, candidatId })
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.saving = false;
        this.showProgrammerModal = false;
        this.loadPassages();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Erreur lors de la programmation.';
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
        this.loadPassages();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  getBadgeClass(res: string): string {
    switch (res) {
      case 'REUSSI': return 'badge-reussi';
      case 'ECHEC': return 'badge-echec';
      case 'AJOURNE': return 'badge-ajourne';
      default: return 'badge-programme';
    }
  }
}
