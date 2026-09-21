import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CodeQuestion, LettreReponse } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-code-questions',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Quiz Exercice — Code de la route</h2>
        <p>{{ questions.length }} question(s). L'ordre est fixe et jamais mélangé : il détermine le découpage en Cycles.</p>
      </div>
      <button class="btn btn-primary" (click)="ouvrirCreation()">
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
                  <button class="btn btn-sm btn-outline" (click)="ouvrirEdition(q)">Modifier</button>
                  <button class="btn btn-sm btn-danger" (click)="supprimer(q)">Supprimer</button>
                </td>
              </tr>
            }
            @if (questions.length === 0) {
              <tr><td colspan="6" class="text-muted">Aucune question dans la banque.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showModal) {
      <div class="modal-backdrop">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3>{{ editingId ? 'Modifier la question' : 'Nouvelle question' }}</h3>
            <button class="btn btn-outline btn-sm" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="enregistrer()">
            <div class="modal-body">
              @if (formError) {
                <div class="alert alert-danger">{{ formError }}</div>
              }
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ordre {{ editingId ? '*' : '(vide = ajout en fin de banque)' }}</label>
                  <input type="number" class="form-control" min="1" [(ngModel)]="form.ordre" name="ordre" [required]="!!editingId" />
                </div>
                <div class="form-group">
                  <label class="form-label">Statut</label>
                  <select class="form-control" [(ngModel)]="form.actif" name="actif">
                    <option [ngValue]="true">Active</option>
                    <option [ngValue]="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Énoncé <span class="required">*</span></label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.enonce" name="enonce" required></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Image (optionnelle)</label>
                <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
                @if (form.imageData) {
                  <img [src]="form.imageData" alt="Aperçu" class="apercu-image" />
                }
                <p class="form-help">Si l'image contient déjà l'énoncé et les choix (question scannée), inutile de retaper le texte des réponses ci-dessous.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Nombre de choix <span class="required">*</span></label>
                <select class="form-control" [(ngModel)]="form.nombreOptions" name="nombreOptions" required (ngModelChange)="onNombreOptionsChange()">
                  <option [ngValue]="2">2 (ex : Oui / Non)</option>
                  <option [ngValue]="3">3 (A / B / C)</option>
                  <option [ngValue]="4">4 (A / B / C / D)</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Texte réponse A (optionnel)</label>
                  <input type="text" class="form-control" [(ngModel)]="form.reponseA" name="reponseA" />
                </div>
                <div class="form-group">
                  <label class="form-label">Texte réponse B (optionnel)</label>
                  <input type="text" class="form-control" [(ngModel)]="form.reponseB" name="reponseB" />
                </div>
              </div>
              @if (form.nombreOptions >= 3) {
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Texte réponse C (optionnel)</label>
                    <input type="text" class="form-control" [(ngModel)]="form.reponseC" name="reponseC" />
                  </div>
                  @if (form.nombreOptions >= 4) {
                    <div class="form-group">
                      <label class="form-label">Texte réponse D (optionnel)</label>
                      <input type="text" class="form-control" [(ngModel)]="form.reponseD" name="reponseD" />
                    </div>
                  }
                </div>
              }
              <div class="form-group">
                <label class="form-label">Bonne(s) réponse(s) <span class="required">*</span></label>
                <div class="bonnes-reponses-check">
                  @for (lettre of lettresPourNombreOptions(form.nombreOptions); track lettre) {
                    <label class="reponse-check">
                      <input type="checkbox"
                             [checked]="form.bonnesReponses.includes(lettre)"
                             (change)="toggleBonneReponse(lettre)" />
                      {{ lettre }}
                    </label>
                  }
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Explication / correction (optionnelle)</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.explication" name="explication"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .page-header p { color: var(--text-muted); }
    .text-muted { color: var(--text-muted); text-align: center; }
    .apercu-image { max-width: 200px; max-height: 140px; margin-top: 0.5rem; border-radius: var(--radius-md); display: block; }
    .table-thumb { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); }
    .bonnes-reponses-check { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .reponse-check { display: flex; align-items: center; gap: 0.4rem; font-weight: 400; cursor: pointer; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class CodeQuestionsComponent implements OnInit {
  questions: CodeQuestion[] = [];
  error = '';
  showModal = false;
  editingId: number | null = null;
  saving = false;
  formError = '';
  form: any = this.formVierge();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    this.apiService.getCodeQuestions().subscribe({
      next: (res) => { this.questions = res; },
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de charger le Quiz Exercice.'); }
    });
  }

  private formVierge(): any {
    return { ordre: null, enonce: '', imageData: '', reponseA: '', reponseB: '', reponseC: '', reponseD: '', nombreOptions: 4, bonnesReponses: [] as LettreReponse[], explication: '', actif: true };
  }

  ouvrirCreation(): void {
    this.editingId = null;
    this.form = this.formVierge();
    this.formError = '';
    this.showModal = true;
  }

  ouvrirEdition(q: CodeQuestion): void {
    this.editingId = q.id;
    this.form = { ...q, bonnesReponses: [...q.bonnesReponses] };
    this.formError = '';
    this.showModal = true;
  }

  lettresPourNombreOptions(n: number): LettreReponse[] {
    return (['A', 'B', 'C', 'D'] as LettreReponse[]).slice(0, n);
  }

  onNombreOptionsChange(): void {
    const lettresValides = this.lettresPourNombreOptions(this.form.nombreOptions);
    this.form.bonnesReponses = this.form.bonnesReponses.filter((l: LettreReponse) => lettresValides.includes(l));
  }

  toggleBonneReponse(lettre: LettreReponse): void {
    const idx = this.form.bonnesReponses.indexOf(lettre);
    if (idx >= 0) {
      this.form.bonnesReponses.splice(idx, 1);
    } else {
      this.form.bonnesReponses.push(lettre);
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
    reader.onload = () => { this.form.imageData = reader.result as string; };
    reader.readAsDataURL(file);
  }

  enregistrer(): void {
    if (this.form.bonnesReponses.length === 0) {
      this.formError = 'Sélectionnez au moins une bonne réponse.';
      return;
    }
    this.saving = true;
    this.formError = '';
    const requete = this.editingId
      ? this.apiService.updateCodeQuestion(this.editingId, this.form)
      : this.apiService.createCodeQuestion(this.form);

    requete.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.charger();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extraireMessageErreur(err, "Erreur lors de l'enregistrement de la question.");
      }
    });
  }

  supprimer(q: CodeQuestion): void {
    if (!confirm(`Supprimer la question n°${q.ordre} ? Cette action est irréversible.`)) return;
    this.apiService.deleteCodeQuestion(q.id).subscribe({
      next: () => this.charger(),
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de supprimer cette question.'); }
    });
  }
}
