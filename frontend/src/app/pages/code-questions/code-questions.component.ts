import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CodeQuestion } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-code-questions',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Banque de questions — Code de la route</h2>
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
              <th>Énoncé</th>
              <th>Bonne réponse</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (q of questions; track q.id) {
              <tr>
                <td>{{ q.ordre }}</td>
                <td>{{ q.enonce }}</td>
                <td>{{ q.bonneReponse }}</td>
                <td><span class="badge" [ngClass]="q.actif ? 'badge-solde' : 'badge-expire'">{{ q.actif ? 'Active' : 'Inactive' }}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline" (click)="ouvrirEdition(q)">Modifier</button>
                  <button class="btn btn-sm btn-danger" (click)="supprimer(q)">Supprimer</button>
                </td>
              </tr>
            }
            @if (questions.length === 0) {
              <tr><td colspan="5" class="text-muted">Aucune question dans la banque.</td></tr>
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
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Réponse A <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="form.reponseA" name="reponseA" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Réponse B <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="form.reponseB" name="reponseB" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Réponse C</label>
                  <input type="text" class="form-control" [(ngModel)]="form.reponseC" name="reponseC" />
                </div>
                <div class="form-group">
                  <label class="form-label">Réponse D</label>
                  <input type="text" class="form-control" [(ngModel)]="form.reponseD" name="reponseD" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Bonne réponse <span class="required">*</span></label>
                <select class="form-control" [(ngModel)]="form.bonneReponse" name="bonneReponse" required>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
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
      error: (err) => { this.error = extraireMessageErreur(err, 'Impossible de charger la banque de questions.'); }
    });
  }

  private formVierge(): any {
    return { ordre: null, enonce: '', imageData: '', reponseA: '', reponseB: '', reponseC: '', reponseD: '', bonneReponse: 'A', explication: '', actif: true };
  }

  ouvrirCreation(): void {
    this.editingId = null;
    this.form = this.formVierge();
    this.formError = '';
    this.showModal = true;
  }

  ouvrirEdition(q: CodeQuestion): void {
    this.editingId = q.id;
    this.form = { ...q };
    this.formError = '';
    this.showModal = true;
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
