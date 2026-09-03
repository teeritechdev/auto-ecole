import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidat, PassageExamen } from '../../core/models/models';

@Component({
  selector: 'app-examens',
  standalone: true,
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

              <div class="form-group">
                <label class="form-label">Candidat <span class="required">*</span></label>
                <select class="form-control" [(ngModel)]="newPassage.candidatId" name="candidatId" required>
                  <option [ngValue]="null">-- Sélectionner le candidat --</option>
                  <option *ngFor="let c of allCandidats" [value]="c.id">
                    {{ c.numeroDossier }} — {{ c.nom }} {{ c.prenom }} ({{ c.categoriePermisCode }})
                  </option>
                </select>
              </div>

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
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showProgrammerModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving || !newPassage.candidatId">
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
  `]
})
export class ExamensComponent implements OnInit {
  passages: PassageExamen[] = [];
  allCandidats: Candidat[] = [];
  loading = false;
  saving = false;

  epreuveFiltre = '';
  resultatFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  showProgrammerModal = false;
  newPassage: any = {
    candidatId: null,
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
    this.apiService.getCandidats('', '', undefined, 0, 200).subscribe({
      next: (res) => this.allCandidats = res.content || []
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
    this.newPassage = {
      candidatId: null,
      typeEpreuve: 'CODE',
      datePassage: new Date().toISOString().substring(0, 10),
      resultat: 'PROGRAMME',
      observations: ''
    };
    this.showProgrammerModal = true;
  }

  saveProgrammer(): void {
    if (!this.newPassage.candidatId) return;

    this.saving = true;
    this.formError = '';

    this.apiService.programmerPassage(this.newPassage).subscribe({
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
