import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CodeQuestion, CodeSerie, LettreReponse } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-code-questions',
  imports: [CommonModule, FormsModule],
  template: `
    @if (!serieSelectionnee) {
      <!-- ============== NIVEAU 1 : LISTE DES SÉRIES ============== -->
      <div class="page-header">
        <div>
          <h2>Séries — Code de la route</h2>
          <p>{{ series.length }} série(s). Chaque série regroupe ses propres questions, numérotées et jamais mélangées.</p>
        </div>
        <button class="btn btn-primary" (click)="ouvrirCreationSerie()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Nouvelle série
        </button>
      </div>

      @if (error) {
        <div class="alert alert-danger">{{ error }}</div>
      }

      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Questions</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (s of series; track s.id) {
                <tr>
                  <td><strong>{{ s.ordre }}</strong></td>
                  <td>
                    <a href="javascript:void(0)" class="serie-link" (click)="ouvrirSerie(s)">{{ s.nom }}</a>
                  </td>
                  <td class="text-muted">{{ s.description || '-' }}</td>
                  <td>{{ s.nombreQuestions }}</td>
                  <td><span class="badge" [ngClass]="s.actif ? 'badge-solde' : 'badge-expire'">{{ s.actif ? 'Active' : 'Inactive' }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline" (click)="ouvrirSerie(s)">Questions</button>
                    <button class="btn btn-sm btn-outline" (click)="ouvrirEditionSerie(s)">Modifier</button>
                    <button class="btn btn-sm btn-danger" (click)="supprimerSerie(s)">Supprimer</button>
                  </td>
                </tr>
              }
              @if (series.length === 0) {
                <tr><td colspan="6" class="text-muted">Aucune série créée pour le moment.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (showSerieModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ editingSerieId ? 'Modifier la série' : 'Nouvelle série' }}</h3>
              <button class="btn btn-outline btn-sm" (click)="showSerieModal = false">✕</button>
            </div>
            <form (ngSubmit)="enregistrerSerie()">
              <div class="modal-body">
                @if (formError) {
                  <div class="alert alert-danger">{{ formError }}</div>
                }
                <div class="form-group">
                  <label class="form-label">Nom <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="serieForm.nom" name="nom" placeholder="Ex : Série 53" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Description (optionnelle)</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="serieForm.description" name="description"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Ordre {{ editingSerieId ? '*' : '(vide = ajout en fin de liste)' }}</label>
                    <input type="number" class="form-control" min="1" [(ngModel)]="serieForm.ordre" name="ordre" [required]="!!editingSerieId" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Statut</label>
                    <select class="form-control" [(ngModel)]="serieForm.actif" name="actif">
                      <option [ngValue]="true">Active</option>
                      <option [ngValue]="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showSerieModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    }

    @if (serieSelectionnee) {
      <!-- ============== NIVEAU 2 : QUESTIONS DE LA SÉRIE ============== -->
      <div class="page-header">
        <div>
          <button class="btn btn-outline btn-sm retour-btn" (click)="retourSeries()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Séries
          </button>
          <h2>{{ serieSelectionnee.nom }}</h2>
          <p>{{ questions.length }} question(s) dans cette série. L'ordre est fixe et jamais mélangé.</p>
        </div>
        <button class="btn btn-primary" (click)="ouvrirCreationQuestion()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Nouvelle question
        </button>
      </div>

      @if (error) {
        <div class="alert alert-danger">{{ error }}</div>
      }

      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Image</th>
                <th>Énoncé</th>
                <th>Bonne(s) réponse(s)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (q of questions; track q.id) {
                <tr>
                  <td><strong>{{ q.ordre }}</strong></td>
                  <td>
                    @if (q.imageData) {
                      <img [src]="q.imageData" alt="Image question" class="table-thumb" />
                    } @else {
                      <span class="text-muted" style="font-size:0.8rem;">Aucune</span>
                    }
                  </td>
                  <td>{{ q.enonce }}</td>
                  <td>{{ q.bonnesReponses.join(', ') }}</td>
                  <td><span class="badge" [ngClass]="q.actif ? 'badge-solde' : 'badge-expire'">{{ q.actif ? 'Active' : 'Inactive' }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline" (click)="ouvrirEditionQuestion(q)">Modifier</button>
                    <button class="btn btn-sm btn-danger" (click)="supprimerQuestion(q)">Supprimer</button>
                  </td>
                </tr>
              }
              @if (questions.length === 0) {
                <tr><td colspan="6" class="text-muted">Aucune question dans cette série.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (showQuestionModal) {
        <div class="modal-backdrop">
          <div class="modal-content modal-xl">
            <div class="modal-header">
              <h3>{{ editingQuestionId ? 'Modifier la question' : 'Nouvelle question' }}</h3>
              <button class="btn btn-outline btn-sm" (click)="showQuestionModal = false">✕</button>
            </div>
            <form (ngSubmit)="enregistrerQuestion()">
              <div class="modal-body modal-body-split">
                <div class="form-col">
                  @if (formError) {
                    <div class="alert alert-danger">{{ formError }}</div>
                  }
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Ordre {{ editingQuestionId ? '*' : '(vide = ajout en fin de série)' }}</label>
                      <input type="number" class="form-control" min="1" [(ngModel)]="questionForm.ordre" name="ordre" [required]="!!editingQuestionId" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Statut</label>
                      <select class="form-control" [(ngModel)]="questionForm.actif" name="actif">
                        <option [ngValue]="true">Active</option>
                        <option [ngValue]="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Énoncé <span class="required">*</span></label>
                    <textarea class="form-control" rows="2" [(ngModel)]="questionForm.enonce" name="enonce" required></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Image (optionnelle)</label>
                    <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
                    <p class="form-help">Si l'image contient déjà l'énoncé et les choix (question scannée), inutile de retaper le texte des réponses ci-dessous.</p>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Nombre de choix <span class="required">*</span></label>
                    <select class="form-control" [(ngModel)]="questionForm.nombreOptions" name="nombreOptions" required (ngModelChange)="onNombreOptionsChange()">
                      <option [ngValue]="2">2 (ex : Oui / Non)</option>
                      <option [ngValue]="3">3 (A / B / C)</option>
                      <option [ngValue]="4">4 (A / B / C / D)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sous-titre avant A/B (optionnel)</label>
                    <input type="text" class="form-control" [(ngModel)]="questionForm.sousTitreGroupeAB" name="sousTitreGroupeAB" placeholder="Ex : pour aller à la station service" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Texte réponse A (optionnel)</label>
                      <input type="text" class="form-control" [(ngModel)]="questionForm.reponseA" name="reponseA" placeholder="OUI" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Texte réponse B (optionnel)</label>
                      <input type="text" class="form-control" [(ngModel)]="questionForm.reponseB" name="reponseB" placeholder="NON" />
                    </div>
                  </div>
                  @if (questionForm.nombreOptions >= 3) {
                    @if (questionForm.nombreOptions >= 4) {
                      <div class="form-group">
                        <label class="form-label">Sous-titre avant C/D (optionnel)</label>
                        <input type="text" class="form-control" [(ngModel)]="questionForm.sousTitreGroupeCD" name="sousTitreGroupeCD" placeholder="Ex : pour aller à Dreux" />
                      </div>
                    }
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">Texte réponse C (optionnel)</label>
                        <input type="text" class="form-control" [(ngModel)]="questionForm.reponseC" name="reponseC" />
                      </div>
                      @if (questionForm.nombreOptions >= 4) {
                        <div class="form-group">
                          <label class="form-label">Texte réponse D (optionnel)</label>
                          <input type="text" class="form-control" [(ngModel)]="questionForm.reponseD" name="reponseD" />
                        </div>
                      }
                    </div>
                  }
                  <div class="form-group">
                    <label class="form-label">Bonne(s) réponse(s) <span class="required">*</span></label>
                    <div class="bonnes-reponses-check">
                      @for (lettre of lettresPourNombreOptions(questionForm.nombreOptions); track lettre) {
                        <label class="reponse-check">
                          <input type="checkbox"
                                 [checked]="questionForm.bonnesReponses.includes(lettre)"
                                 (change)="toggleBonneReponse(lettre)" />
                          {{ lettre }}
                        </label>
                      }
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Explication / correction (optionnelle)</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="questionForm.explication" name="explication"></textarea>
                  </div>
                </div>

                <div class="preview-col">
                  <div class="preview-label">Aperçu (rendu candidat)</div>
                  <div class="quiz-preview">
                    @if (questionForm.imageData) {
                      <img [src]="questionForm.imageData" alt="Aperçu" class="preview-image" />
                    }
                    <p class="preview-enonce">{{ questionForm.enonce || 'Énoncé de la question...' }}</p>

                    @if (questionForm.sousTitreGroupeAB) {
                      <p class="preview-groupe">{{ questionForm.sousTitreGroupeAB }}</p>
                    }
                    <div class="preview-options">
                      @for (lettre of lettresPourNombreOptions(questionForm.nombreOptions).slice(0, 2); track lettre) {
                        <div class="preview-option">
                          <span class="preview-check"></span>
                          <span class="preview-texte">{{ texteOptionForm(lettre) }}</span>
                          <span class="preview-dots"></span>
                          <span class="preview-lettre">{{ lettre }}</span>
                        </div>
                      }
                    </div>
                    @if (questionForm.nombreOptions >= 4) {
                      @if (questionForm.sousTitreGroupeCD) {
                        <p class="preview-groupe">{{ questionForm.sousTitreGroupeCD }}</p>
                      }
                      <div class="preview-options">
                        @for (lettre of lettresPourNombreOptions(questionForm.nombreOptions).slice(2, 4); track lettre) {
                          <div class="preview-option">
                            <span class="preview-check"></span>
                            <span class="preview-texte">{{ texteOptionForm(lettre) }}</span>
                            <span class="preview-dots"></span>
                            <span class="preview-lettre">{{ lettre }}</span>
                          </div>
                        }
                      </div>
                    } @else if (questionForm.nombreOptions === 3) {
                      <div class="preview-options">
                        <div class="preview-option">
                          <span class="preview-check"></span>
                          <span class="preview-texte">{{ texteOptionForm('C') }}</span>
                          <span class="preview-dots"></span>
                          <span class="preview-lettre">C</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showQuestionModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .page-header p { color: var(--text-muted); }
    .retour-btn { margin-bottom: 0.6rem; }
    .text-muted { color: var(--text-muted); }
    td.text-muted { text-align: left; }
    .serie-link { color: var(--primary); font-weight: 600; text-decoration: none; cursor: pointer; }
    .serie-link:hover { text-decoration: underline; }
    .table-thumb { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); }
    .bonnes-reponses-check { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .reponse-check { display: flex; align-items: center; gap: 0.4rem; font-weight: 400; cursor: pointer; }
    .modal-xl { max-width: 980px; width: 100%; }
    .modal-body-split { display: flex; gap: 1.5rem; align-items: flex-start; }
    .form-col { flex: 1 1 55%; min-width: 0; }
    .preview-col { flex: 1 1 45%; min-width: 0; position: sticky; top: 0; }
    .preview-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted); margin-bottom: 0.5rem; }
    .quiz-preview { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; }
    .preview-image { max-width: 100%; max-height: 180px; border-radius: var(--radius-md); display: block; margin: 0 auto 0.85rem; }
    .preview-enonce { font-size: 1rem; font-weight: 700; margin-bottom: 0.85rem; }
    .preview-groupe { font-weight: 700; margin: 0.75rem 0 0.4rem; }
    .preview-options { display: flex; flex-direction: column; gap: 0.5rem; }
    .preview-option { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); }
    .preview-check { width: 16px; height: 16px; flex-shrink: 0; border-radius: 4px; border: 1.5px solid var(--border-color); }
    .preview-texte { white-space: nowrap; }
    .preview-dots { flex: 1; border-bottom: 2px dotted var(--border-color); margin: 0 0.25rem; align-self: flex-end; height: 0.65em; }
    .preview-lettre { font-weight: 700; color: var(--primary); }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class CodeQuestionsComponent implements OnInit {
  series: CodeSerie[] = [];
  serieSelectionnee: CodeSerie | null = null;
  questions: CodeQuestion[] = [];
  error = '';
  formError = '';
  saving = false;

  showSerieModal = false;
  editingSerieId: number | null = null;
  serieForm: any = this.serieFormVierge();

  showQuestionModal = false;
  editingQuestionId: number | null = null;
  questionForm: any = this.questionFormVierge();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.chargerSeries();
  }

  private chargerSeries(): void {
    this.apiService.getCodeSeries().subscribe({
      next: (res) => { this.series = res; },
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de charger les séries.'); }
    });
  }

  // ============== SÉRIES ==============

  ouvrirSerie(s: CodeSerie): void {
    this.serieSelectionnee = s;
    this.error = '';
    this.chargerQuestions();
  }

  retourSeries(): void {
    this.serieSelectionnee = null;
    this.questions = [];
    this.error = '';
    this.chargerSeries();
  }

  private serieFormVierge(): any {
    return { nom: '', description: '', ordre: null, actif: true };
  }

  ouvrirCreationSerie(): void {
    this.editingSerieId = null;
    this.serieForm = this.serieFormVierge();
    this.formError = '';
    this.showSerieModal = true;
  }

  ouvrirEditionSerie(s: CodeSerie): void {
    this.editingSerieId = s.id;
    this.serieForm = { ...s };
    this.formError = '';
    this.showSerieModal = true;
  }

  enregistrerSerie(): void {
    this.saving = true;
    this.formError = '';
    const requete = this.editingSerieId
      ? this.apiService.updateCodeSerie(this.editingSerieId, this.serieForm)
      : this.apiService.createCodeSerie(this.serieForm);

    requete.subscribe({
      next: () => {
        this.saving = false;
        this.showSerieModal = false;
        this.chargerSeries();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, "Erreur lors de l'enregistrement de la série.");
      }
    });
  }

  supprimerSerie(s: CodeSerie): void {
    if (!confirm(`Supprimer la série « ${s.nom} » ? Cette action est irréversible.`)) return;
    this.apiService.deleteCodeSerie(s.id).subscribe({
      next: () => this.chargerSeries(),
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de supprimer cette série.'); }
    });
  }

  // ============== QUESTIONS ==============

  private chargerQuestions(): void {
    if (!this.serieSelectionnee) return;
    this.apiService.getCodeQuestions(this.serieSelectionnee.id).subscribe({
      next: (res) => { this.questions = res; },
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de charger les questions de cette série.'); }
    });
  }

  private questionFormVierge(): any {
    return {
      ordre: null, enonce: '', imageData: '',
      reponseA: '', reponseB: '', reponseC: '', reponseD: '',
      sousTitreGroupeAB: '', sousTitreGroupeCD: '',
      nombreOptions: 4, bonnesReponses: [] as LettreReponse[], explication: '', actif: true
    };
  }

  ouvrirCreationQuestion(): void {
    this.editingQuestionId = null;
    this.questionForm = this.questionFormVierge();
    this.formError = '';
    this.showQuestionModal = true;
  }

  ouvrirEditionQuestion(q: CodeQuestion): void {
    this.editingQuestionId = q.id;
    this.questionForm = { ...q, bonnesReponses: [...q.bonnesReponses] };
    this.formError = '';
    this.showQuestionModal = true;
  }

  lettresPourNombreOptions(n: number): LettreReponse[] {
    return (['A', 'B', 'C', 'D'] as LettreReponse[]).slice(0, n);
  }

  texteOptionForm(lettre: LettreReponse): string {
    const texte = { A: this.questionForm.reponseA, B: this.questionForm.reponseB, C: this.questionForm.reponseC, D: this.questionForm.reponseD }[lettre];
    return texte || (lettre === 'A' ? 'OUI' : lettre === 'B' ? 'NON' : lettre);
  }

  onNombreOptionsChange(): void {
    const lettresValides = this.lettresPourNombreOptions(this.questionForm.nombreOptions);
    this.questionForm.bonnesReponses = this.questionForm.bonnesReponses.filter((l: LettreReponse) => lettresValides.includes(l));
    if (this.questionForm.nombreOptions < 4) {
      this.questionForm.sousTitreGroupeCD = '';
    }
  }

  toggleBonneReponse(lettre: LettreReponse): void {
    const idx = this.questionForm.bonnesReponses.indexOf(lettre);
    if (idx >= 0) {
      this.questionForm.bonnesReponses.splice(idx, 1);
    } else {
      this.questionForm.bonnesReponses.push(lettre);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.formError = "L'image ne doit pas dépasser 2 Mo.";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.questionForm.imageData = reader.result as string; };
    reader.readAsDataURL(file);
  }

  enregistrerQuestion(): void {
    if (!this.serieSelectionnee) return;
    if (this.questionForm.bonnesReponses.length === 0) {
      this.formError = 'Sélectionnez au moins une bonne réponse.';
      return;
    }
    this.saving = true;
    this.formError = '';
    const payload = { ...this.questionForm, serieId: this.serieSelectionnee.id };
    const requete = this.editingQuestionId
      ? this.apiService.updateCodeQuestion(this.editingQuestionId, payload)
      : this.apiService.createCodeQuestion(payload);

    requete.subscribe({
      next: () => {
        this.saving = false;
        this.showQuestionModal = false;
        this.chargerQuestions();
        this.chargerSeries();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, "Erreur lors de l'enregistrement de la question.");
      }
    });
  }

  supprimerQuestion(q: CodeQuestion): void {
    if (!confirm(`Supprimer la question n°${q.ordre} ? Cette action est irréversible.`)) return;
    this.apiService.deleteCodeQuestion(q.id).subscribe({
      next: () => { this.chargerQuestions(); this.chargerSeries(); },
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de supprimer cette question.'); }
    });
  }
}
