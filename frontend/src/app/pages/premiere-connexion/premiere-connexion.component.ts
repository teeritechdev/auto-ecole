import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-premiere-connexion',
  imports: [FormsModule],
  template: `
    <div class="wrapper">
      <div class="card">
        <h1>Première connexion</h1>
        <p class="subtitle">Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant d'accéder à votre espace.</p>

        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Mot de passe temporaire (reçu du secrétariat) <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="ancienPassword" name="ancien" required />
          </div>
          <div class="form-group">
            <label class="form-label">Nouveau mot de passe (8 caractères minimum) <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="nouveauPassword" name="nouveau" required minlength="8" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmer le nouveau mot de passe <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="confirmation" name="confirmation" required />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading || !ancienPassword || nouveauPassword.length < 8 || !confirmation">
            {{ loading ? 'Enregistrement...' : 'Valider et continuer' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-main); padding: 1.5rem; }
    .card { background: var(--bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 2rem; max-width: 420px; width: 100%; }
    h1 { font-size: 1.3rem; margin-bottom: 0.5rem; }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
    form { display: flex; flex-direction: column; gap: 1rem; }
    .btn { width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class PremiereConnexionComponent {
  ancienPassword = '';
  nouveauPassword = '';
  confirmation = '';
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    if (this.nouveauPassword !== this.confirmation) {
      this.error = 'La confirmation ne correspond pas au nouveau mot de passe.';
      return;
    }

    this.loading = true;
    this.authService.changePassword({
      ancienPassword: this.ancienPassword,
      nouveauPassword: this.nouveauPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        const role = this.authService.currentUserValue?.role;
        this.router.navigate([role === 'CANDIDAT' ? '/espace-candidat' : '/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = extraireMessageErreur(err, 'Erreur lors du changement de mot de passe.');
      }
    });
  }
}
