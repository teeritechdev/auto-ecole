import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CodeConfiguration } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-parametrage-code',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <h2>🎓 Configuration du Code de la route</h2>
      <p>Ces règles s'appliquent à toutes les tentatives démarrées après leur enregistrement (les tentatives déjà en cours ou terminées ne sont pas affectées).</p>
    </div>

    @if (loading) {
      <div class="card">Chargement...</div>
    }

    @if (error && !config) {
      <div class="alert alert-danger">{{ error }}</div>
    }

    @if (config) {
      <div class="card">
        <div class="card-header">
          <div class="card-title">Banque de questions</div>
          <a routerLink="/code/questions" class="btn btn-outline btn-sm">Gérer les questions</a>
        </div>
        <p>{{ config.nombreQuestionsActives }} question(s) active(s) — {{ config.nombreDeCycles }} Cycle(s) au total.</p>
      </div>

      <form (ngSubmit)="enregistrer()">
        <div class="card">
          <div class="card-header"><div class="card-title">Règles du Cycle</div></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Questions par Cycle <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.questionsParCycle" name="questionsParCycle" required />
            </div>
            <div class="form-group">
              <label class="form-label">Seuil de réussite <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.seuilReussite" name="seuilReussite" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Temps par question (secondes) <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.tempsParQuestionSecondes" name="tempsParQuestion" required />
            </div>
            <div class="form-group">
              <label class="form-label">Durée maximale du Cycle (secondes) <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.dureeMaxCycleSecondes" name="dureeMaxCycle" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre maximum de tentatives <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.tentativesMax" name="tentativesMax" required />
            </div>
            <div class="form-group">
              <label class="form-label">Expiration de l'accès au module (jours, vide = illimité)</label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.dureeExpirationAccesJours" name="dureeExpiration" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Comportement</div></div>
          <label class="checkbox-row">
            <input type="checkbox" [(ngModel)]="config.repriseAutoriseeApresEchec" name="repriseAutorisee" />
            Autoriser la reprise d'un Cycle après échec
          </label>
          <label class="checkbox-row">
            <input type="checkbox" [(ngModel)]="config.retourQuestionPrecedenteAutorise" name="retourAutorise" />
            Autoriser le retour à la question précédente
          </label>
          <label class="checkbox-row">
            <input type="checkbox" [(ngModel)]="config.correctionImmediate" name="correctionImmediate" />
            Afficher la correction immédiatement après chaque réponse
          </label>
          <label class="checkbox-row">
            <input type="checkbox" [(ngModel)]="config.deblocageAutomatiqueCycleSuivant" name="deblocageAuto" />
            Déblocage séquentiel des Cycles (sinon, tous les Cycles sont disponibles dès le départ)
          </label>
        </div>

        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }
        @if (success) {
          <div class="alert alert-success">Configuration enregistrée.</div>
        }

        <button type="submit" class="btn btn-primary" [disabled]="saving">
          {{ saving ? 'Enregistrement...' : 'Enregistrer la configuration' }}
        </button>
      </form>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header p { color: var(--text-muted); }
    .checkbox-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ParametrageCodeComponent implements OnInit {
  config: CodeConfiguration | null = null;
  loading = false;
  saving = false;
  error = '';
  success = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getCodeConfiguration().subscribe({
      next: (res) => { this.loading = false; this.config = res; },
      error: (err) => { this.loading = false; this.error = extraireMessageErreur(err, 'Impossible de charger la configuration.'); }
    });
  }

  enregistrer(): void {
    if (!this.config) return;
    this.saving = true;
    this.error = '';
    this.success = false;
    this.apiService.updateCodeConfiguration(this.config).subscribe({
      next: (res) => { this.saving = false; this.config = res; this.success = true; },
      error: (err) => { this.saving = false; this.error = extraireMessageErreur(err, "Erreur lors de l'enregistrement."); }
    });
  }
}
