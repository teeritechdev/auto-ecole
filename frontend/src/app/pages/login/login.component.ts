import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    template: `
    <div class="login-page">
      <div class="login-container">
        <h1 class="brand-title">{{ nomEtablissement }}</h1>

        @if (errorMessage) {
          <div class="alert-box alert-error">
            <div class="alert-text">{{ errorMessage }}</div>
            <button type="button" class="alert-close" (click)="errorMessage = ''" title="Fermer">✕</button>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-field">
            <label class="field-label" for="username">Identifiant ou Adresse Email</label>
            <input
              id="username"
              type="text"
              class="custom-input"
              [(ngModel)]="username"
              name="username"
              required
              placeholder="Ex: nom.utilisateur ou email"
              [disabled]="loading"
              autocomplete="username"
              autofocus
              />
          </div>

          <div class="form-field">
            <label class="field-label" for="password">Mot de passe</label>
            <div class="input-wrapper">
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                class="custom-input has-action"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••••••"
                [disabled]="loading"
                autocomplete="current-password"
                />
              <button
                type="button"
                class="input-toggle-btn"
                (click)="showPassword = !showPassword"
                [title]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                tabindex="-1"
                >
                @if (!showPassword) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
                @if (showPassword) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                }
              </button>
            </div>
          </div>

          <div class="form-extra-row">
            <label class="remember-me">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
              <span class="custom-checkbox"></span>
              <span class="remember-text">Se souvenir de moi</span>
            </label>
            <button type="button" class="forgot-link" (click)="showForgotModal = true">
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            class="btn-submit"
            [disabled]="loading || !username.trim() || !password.trim()"
            >
            @if (loading) {
              <span class="spinner-inline"></span>
              <span>Connexion en cours...</span>
            }
            @if (!loading) {
              <span>Accéder à l'espace de gestion</span>
            }
          </button>
        </form>

        <p class="copyright">© {{ anneeCourante }} {{ nomEtablissement }}. Tous droits réservés.</p>
      </div>

      @if (showForgotModal) {
        <div class="modal-backdrop" (click)="showForgotModal = false">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <h3>Assistance & Réinitialisation</h3>
            <div class="modal-dialog-body">
              <p>
                Pour des raisons de sécurité et de conformité, la réinitialisation des mots de passe des comptes
                (Administrateur, Secrétariat, Caisse, Moniteur) est centralisée.
              </p>
              <div class="modal-info-box">
                <strong>Que devez-vous faire ?</strong>
                <p>Veuillez contacter l'administrateur système ou la direction de l'auto-école pour demander le renouvellement de vos identifiants d'accès.</p>
              </div>
            </div>
            <div class="modal-dialog-footer">
              <button type="button" class="btn btn-primary" (click)="showForgotModal = false">
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      }
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .login-page {
      min-height: 100vh;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      box-sizing: border-box;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .login-container {
      width: 100%;
      max-width: 380px;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      margin: 0 0 1.5rem;
    }

    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-size: 0.84rem;
      margin-bottom: 1.25rem;
    }

    .alert-error {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-text { flex: 1; line-height: 1.45; font-weight: 500; }

    .alert-close {
      background: none;
      border: none;
      color: #991b1b;
      font-size: 1rem;
      cursor: pointer;
      padding: 0 0.25rem;
      opacity: 0.7;
    }

    .alert-close:hover { opacity: 1; }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field-label {
      font-size: 0.84rem;
      font-weight: 600;
      color: #334155;
    }

    .input-wrapper { position: relative; display: flex; align-items: center; }

    .custom-input {
      width: 100%;
      height: 46px;
      padding: 0 1rem;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.92rem;
      color: #0f172a;
      font-family: inherit;
      box-sizing: border-box;
    }

    .custom-input.has-action { padding-right: 2.75rem; }

    .custom-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .custom-input::placeholder { color: #94a3b8; }

    .input-toggle-btn {
      position: absolute;
      right: 0.65rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem;
      border-radius: 6px;
    }

    .input-toggle-btn:hover { color: #334155; background: #f1f5f9; }
    .input-toggle-btn svg { width: 18px; height: 18px; }

    .form-extra-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.82rem;
      color: #475569;
      user-select: none;
    }

    .remember-me input { position: absolute; opacity: 0; height: 0; width: 0; }

    .custom-checkbox {
      width: 17px;
      height: 17px;
      border: 1.5px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .remember-me input:checked ~ .custom-checkbox {
      background-color: #2563eb;
      border-color: #2563eb;
    }

    .remember-me input:checked ~ .custom-checkbox::after {
      content: '';
      width: 4px;
      height: 8px;
      border: solid #ffffff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-bottom: 2px;
    }

    .forgot-link {
      background: none;
      border: none;
      color: #2563eb;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .forgot-link:hover { text-decoration: underline; }

    .btn-submit {
      width: 100%;
      height: 46px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .btn-submit:hover:not(:disabled) { background: #1d4ed8; }

    .btn-submit:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .copyright {
      margin: 1.5rem 0 0;
      text-align: center;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .spinner-inline {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1.5rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 14px;
      max-width: 440px;
      width: 100%;
      padding: 1.5rem;
      box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
    }

    .modal-dialog h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #0f172a; }

    .modal-dialog-body { font-size: 0.88rem; color: #475569; line-height: 1.55; }

    .modal-info-box {
      margin-top: 1rem;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 0.75rem 1rem;
      border-radius: 0 8px 8px 0;
    }

    .modal-info-box strong { color: #1e293b; display: block; margin-bottom: 0.25rem; }
    .modal-info-box p { margin: 0; font-size: 0.84rem; color: #64748b; }

    .modal-dialog-footer {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  loading = false;
  errorMessage = '';
  showForgotModal = false;

  nomEtablissement = 'Nerwaya Auto-École';
  anneeCourante = new Date().getFullYear();

  constructor(private authService: AuthService, private router: Router, private apiService: ApiService) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.hasRole(['CANDIDAT']) ? '/espace-candidat' : '/dashboard']);
    }
  }

  ngOnInit(): void {
    this.apiService.getIdentitePublique().subscribe({
      next: (id) => { this.nomEtablissement = id.nomEtablissement; },
      error: () => {}
    });
  }

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (user) => {
        this.loading = false;
        if (user.doitChangerMotDePasse) {
          this.router.navigate(['/premiere-connexion']);
        } else if (user.role === 'CANDIDAT') {
          this.router.navigate(['/espace-candidat']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur Backend (Spring Boot sur le port 8080). Assurez-vous que le backend et PostgreSQL sont bien démarrés.';
        } else if (err.status === 401) {
          this.errorMessage = 'Identifiant ou mot de passe incorrect. Veuillez vérifier vos accès.';
        } else if (err.status === 403) {
          this.errorMessage = 'Votre compte est désactivé ou vous n\'avez pas les autorisations nécessaires.';
        } else {
          this.errorMessage = extraireMessageErreur(err, 'Une erreur est survenue lors de la tentative de connexion.');
        }
      }
    });
  }
}
