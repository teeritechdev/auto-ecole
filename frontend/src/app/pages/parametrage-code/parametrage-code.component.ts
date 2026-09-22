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
      <h2 style="display:flex; align-items:center; gap:0.5rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
        Configuration du Code de la route
      </h2>
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
          <div class="card-title">Séries & Questions</div>
          <a routerLink="/code/questions" class="btn btn-outline btn-sm">Gérer les séries et questions</a>
        </div>
        <p>{{ config.nombreDeSeries }} série(s) active(s). La taille de chaque série dépend du nombre de questions qui lui sont assignées.</p>
      </div>

      <form (ngSubmit)="enregistrer()">
        <div class="card">
          <div class="card-header"><div class="card-title">Règles de la série</div></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Seuil de réussite <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.seuilReussite" name="seuilReussite" required />
            </div>
            <div class="form-group">
              <label class="form-label">Temps par question (secondes) <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.tempsParQuestionSecondes" name="tempsParQuestion" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Durée maximale d'une série (secondes) <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.dureeMaxSerieSecondes" name="dureeMaxSerie" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre maximum de tentatives <span class="required">*</span></label>
              <input type="number" class="form-control" min="1" [(ngModel)]="config.tentativesMax" name="tentativesMax" required />
            </div>
          </div>
          <div class="form-row">
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
            Autoriser la reprise d'une série après échec
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
            <input type="checkbox" [(ngModel)]="config.deblocageAutomatiqueSerieSuivante" name="deblocageAuto" />
            Déblocage séquentiel des séries (sinon, toutes les séries sont disponibles dès le départ)
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
