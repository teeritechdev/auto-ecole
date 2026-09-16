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
    <div class="login-split" [class.no-image]="!imageConnexion">
      <!-- IMAGE DE FOND : illustration configurable (Paramètres Généraux > Identité), pleine
           page, ancrée à droite et estompée en diagonale vers la gauche derrière le formulaire.
           Sans image définie, on affiche un simple dégradé blanc plutôt qu'un repli coloré. -->
      @if (imageConnexion) {
        <div class="login-image-panel" [style.background-image]="'url(' + imageConnexion + ')'"></div>
        <div class="login-image-blend"></div>
      }

      <!-- FORMULAIRE : à gauche, sur la zone estompée -->
      <div class="login-wrapper">
      <div class="login-container">
        <!-- Main Login Card -->
        <div class="login-card">
          <!-- Header & Branding -->
          <div class="login-header">
            <div class="brand-logo-wrapper">
              <div class="brand-badge">
                @if (logoData) {
                  <img [src]="logoData" alt="Logo" class="brand-logo-img" />
                } @else {
                  <svg class="brand-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                    <circle cx="7" cy="17" r="2"/>
                    <path d="M9 17h6"/>
                    <circle cx="17" cy="17" r="2"/>
                  </svg>
                }
              </div>
              <div class="badge-ring"></div>
            </div>

            <h1 class="brand-title">{{ nomEtablissement }}</h1>
            <p class="brand-subtitle">Plateforme Intégrée de Gestion & Formation</p>
            <div class="brand-divider"></div>
          </div>
    
          <!-- Alert Error -->
          @if (errorMessage) {
            <div class="alert-box alert-error">
              <div class="alert-icon-wrap">
                <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div class="alert-text">{{ errorMessage }}</div>
              <button type="button" class="alert-close" (click)="errorMessage = ''" title="Fermer">✕</button>
            </div>
          }
    
          <!-- Login Form -->
          <form (ngSubmit)="onSubmit()" class="login-form">
            <!-- Username Input -->
            <div class="form-field">
              <label class="field-label" for="username">
                Identifiant ou Adresse Email
                <span class="required-star">*</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
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
            </div>
    
            <!-- Password Input -->
            <div class="form-field">
              <div class="field-label-row">
                <label class="field-label" for="password">
                  Mot de passe
                  <span class="required-star">*</span>
                </label>
              </div>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
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
                  <!-- Eye open -->
                  @if (!showPassword) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  }
                  <!-- Eye slash -->
                  @if (showPassword) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  }
                </button>
              </div>
            </div>
    
            <!-- Extra Actions / Options -->
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
    
            <!-- Submit Button -->
            <button
              type="submit"
              class="btn-submit"
              [disabled]="loading || !username.trim() || !password.trim()"
              >
              @if (loading) {
                <span class="spinner-inline"></span>
              }
              @if (!loading) {
                <span class="btn-content">
                  <span>Accéder à l'espace de gestion</span>
                  <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              }
              @if (loading) {
                <span>Connexion en cours...</span>
              }
            </button>
          </form>
    
          <!-- Security Footnote -->
          <div class="card-security-footer">
            <div class="security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Accès réservé au personnel autorisé • Chiffrement TLS 256 bits</span>
            </div>
          </div>
        </div>
    
        <!-- Global Bottom Branding -->
        <div class="global-footer">
          @if (telephone || adresseSiege) {
            <p class="footer-contact">
              @if (telephone) { <span>{{ telephone }}</span> }
              @if (telephone && adresseSiege) { <span class="caption-dot">•</span> }
              @if (adresseSiege) { <span>{{ adresseSiege }}</span> }
            </p>
          }
          <p>© {{ anneeCourante }} <strong>{{ nomEtablissement }}</strong>. Tous droits réservés.</p>
        </div>
      </div>

      <!-- Forgot Password Modal -->
      @if (showForgotModal) {
        <div class="modal-backdrop" (click)="showForgotModal = false">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-dialog-header">
              <div class="modal-dialog-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Assistance & Réinitialisation</h3>
            </div>
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
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .login-split {
      height: 100vh;
      position: relative;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: #090e1a;
    }

    .login-split::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1e40af, #3b82f6, #0ea5e9);
      z-index: 5;
    }

    /* Sans image de connexion définie : simple dégradé blanc, pas de photo ni de zone sombre. */
    .login-split.no-image {
      background: linear-gradient(135deg, #ffffff 0%, #f3f7ff 55%, #e3ecfd 100%);
    }

    /* Image de fond : illustration configurable (Paramètres Généraux > Identité), ancrée à droite. */
    .login-image-panel {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center right;
      z-index: 0;
    }

    /* Estompage diagonal : opaque à gauche (où repose le formulaire), transparent à droite
       (où l'image domine) — c'est ce dégradé qui "fait apparaître" l'image vers la droite. */
    .login-image-blend {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(100deg, #090e1a 0%, #090e1a 40%, rgba(9, 14, 26, 0.7) 54%, transparent 74%);
    }

    .caption-dot { opacity: 0.6; }

    @media (max-width: 900px) {
      .login-image-blend { background: #090e1a; }
    }

    .login-wrapper {
      position: relative;
      z-index: 2;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 1rem 6vw;
      box-sizing: border-box;
    }

    @media (max-width: 900px) {
      .login-wrapper { justify-content: center; padding: 1rem 1.25rem; }
    }

    .login-container {
      width: 100%;
      max-width: 460px;
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-height: 100%;
    }

    /* Plus de carte : le formulaire repose directement sur la page (fond photo ou dégradé
       blanc selon qu'une image de connexion est définie ou non). */
    .login-card {
      width: 100%;
      background: transparent;
      box-shadow: none;
      padding: 0;
      position: relative;
    }

    /* Header */
    .login-header {
      text-align: center;
      margin-bottom: 1.1rem;
    }

    .brand-logo-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      margin: 0 auto 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-badge {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #38bdf8 100%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -4px rgba(37, 99, 235, 0.45);
      color: #ffffff;
      position: relative;
      z-index: 2;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .login-card:hover .brand-badge {
      transform: scale(1.05) rotate(-2deg);
    }

    .brand-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 18px;
    }

    .brand-svg-icon {
      width: 34px;
      height: 34px;
      stroke: #ffffff;
    }

    .badge-ring {
      position: absolute;
      inset: -4px;
      border-radius: 22px;
      border: 2px dashed rgba(37, 99, 235, 0.35);
      animation: spinSlow 25s linear infinite;
    }

    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Sans carte, ce texte repose directement sur la page : les couleurs par défaut
       supposent le fond sombre (image + estompage) ; l'override .no-image plus bas les
       assombrit pour rester lisibles sur le dégradé blanc. */
    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.55rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin: 0;
      line-height: 1.25;
      background: linear-gradient(135deg, #ffffff 0%, #bfdbfe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .login-split.no-image .brand-title {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      font-size: 0.84rem;
      color: #cbd5e1;
      margin-top: 0.35rem;
      font-weight: 500;
      letter-spacing: -0.01em;
    }

    .login-split.no-image .brand-subtitle { color: #64748b; }

    .brand-divider {
      width: 44px;
      height: 3px;
      background: linear-gradient(90deg, #2563eb, #38bdf8);
      border-radius: 3px;
      margin: 0.75rem auto 0;
    }

    /* Alert */
    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      font-size: 0.84rem;
      margin-bottom: 1.5rem;
      animation: alertSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes alertSlideIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .alert-error {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-icon-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      margin-top: 1px;
    }

    .alert-icon {
      width: 18px;
      height: 18px;
      stroke: #dc2626;
    }

    .alert-text {
      flex: 1;
      line-height: 1.45;
      font-weight: 500;
    }

    .alert-close {
      background: none;
      border: none;
      color: #991b1b;
      font-size: 1rem;
      cursor: pointer;
      padding: 0 0.25rem;
      opacity: 0.7;
      transition: opacity 0.15s;
    }

    .alert-close:hover {
      opacity: 1;
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .field-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .field-label {
      font-size: 0.84rem;
      font-weight: 600;
      color: #e2e8f0;
      letter-spacing: -0.01em;
    }

    .login-split.no-image .field-label { color: #334155; }

    .required-star {
      color: #ef4444;
      font-weight: bold;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      pointer-events: none;
      transition: color 0.2s;
    }

    .input-icon svg {
      width: 19px;
      height: 19px;
    }

    .custom-input {
      width: 100%;
      height: 48px;
      padding: 0 1rem 0 2.85rem;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.92rem;
      color: #0f172a;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: inherit;
    }

    .custom-input.has-action {
      padding-right: 2.85rem;
    }

    .custom-input:hover:not(:disabled) {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .custom-input:focus {
      outline: none;
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    }

    .custom-input:focus + .input-icon,
    .input-wrapper:focus-within .input-icon {
      color: #2563eb;
    }

    .custom-input::placeholder {
      color: #94a3b8;
      font-size: 0.88rem;
    }

    .input-toggle-btn {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.4rem;
      border-radius: 8px;
      transition: all 0.15s;
    }

    .input-toggle-btn:hover {
      color: #334155;
      background: #f1f5f9;
    }

    .input-toggle-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Extra row: Remember & Forgot */
    .form-extra-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: -0.25rem;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.82rem;
      color: #cbd5e1;
      user-select: none;
    }

    .login-split.no-image .remember-me { color: #475569; }

    .remember-me input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .custom-checkbox {
      width: 17px;
      height: 17px;
      border: 1.5px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
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

    .remember-text {
      font-weight: 500;
    }

    .forgot-link {
      background: none;
      border: none;
      color: #60a5fa;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }

    .login-split.no-image .forgot-link { color: #2563eb; }
    .login-split.no-image .forgot-link:hover { color: #1d4ed8; }

    .forgot-link:hover {
      color: #93c5fd;
      text-decoration: underline;
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.4);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      margin-top: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
      transform: translateY(-2px);
      box-shadow: 0 12px 25px -4px rgba(37, 99, 235, 0.5);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 4px 10px -2px rgba(37, 99, 235, 0.4);
    }

    .btn-submit:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-arrow {
      width: 17px;
      height: 17px;
      transition: transform 0.2s ease;
    }

    .btn-submit:hover .btn-arrow {
      transform: translateX(4px);
    }

    .spinner-inline {
      width: 20px;
      height: 20px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Security Footer */
    .card-security-footer {
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      text-align: center;
    }

    .login-split.no-image .card-security-footer { border-top-color: #f1f5f9; }

    .security-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.74rem;
      color: #cbd5e1;
      font-weight: 500;
    }

    .login-split.no-image .security-badge { color: #64748b; }

    .security-badge svg {
      width: 14px;
      height: 14px;
      color: #10b981;
      flex-shrink: 0;
    }

    /* Global Bottom */
    .global-footer {
      margin-top: 0.9rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .global-footer strong {
      color: #e2e8f0;
      font-weight: 600;
    }

    .footer-contact {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.35rem;
      color: #cbd5e1;
    }

    /* Sur fond blanc (pas d'image définie), le texte clair prévu pour un fond sombre
       deviendrait illisible : on bascule vers des teintes foncées. */
    .login-split.no-image .global-footer { color: #64748b; }
    .login-split.no-image .global-footer strong { color: #1e293b; }
    .login-split.no-image .footer-contact { color: #475569; }

    /* Forgot Password Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 1.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-dialog-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.15rem;
    }

    .modal-dialog-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-dialog-icon svg {
      width: 22px;
      height: 22px;
    }

    .modal-dialog-header h3 {
      font-size: 1.15rem;
      color: #0f172a;
      margin: 0;
    }

    .modal-dialog-body {
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.55;
    }

    .modal-info-box {
      margin-top: 1rem;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 0.75rem 1rem;
      border-radius: 0 8px 8px 0;
    }

    .modal-info-box strong {
      color: #1e293b;
      display: block;
      margin-bottom: 0.25rem;
    }

    .modal-info-box p {
      margin: 0;
      font-size: 0.84rem;
      color: #64748b;
    }

    .modal-dialog-footer {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 480px) {
      .brand-title {
        font-size: 1.35rem;
      }
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
  logoData: string | null = null;
  imageConnexion: string | null = null;
  telephone: string | null = null;
  adresseSiege: string | null = null;
  anneeCourante = new Date().getFullYear();

  constructor(private authService: AuthService, private router: Router, private apiService: ApiService) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.hasRole(['CANDIDAT']) ? '/espace-candidat' : '/dashboard']);
    }
  }

  ngOnInit(): void {
    this.apiService.getIdentitePublique().subscribe({
      next: (id) => {
        this.nomEtablissement = id.nomEtablissement;
        this.logoData = id.logoData;
        this.imageConnexion = id.imageConnexion;
        this.telephone = id.telephone;
        this.adresseSiege = id.adresseSiege;
      },
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
