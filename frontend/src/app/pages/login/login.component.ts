import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <!-- VOLET GAUCHE (Desktop) / Formulaire d'identification -->
      <section class="form-section">
        <div class="form-container">
          <div class="form-header">
            <h1 class="form-title">Connexion</h1>
            <p class="form-subtitle">Connectez-vous pour accéder à votre espace.</p>
          </div>

          @if (errorMessage) {
            <div class="alert-box alert-error">
              <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div class="alert-text">{{ errorMessage }}</div>
              <button type="button" class="alert-close" (click)="errorMessage = ''" title="Fermer">✕</button>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label class="form-label" for="username">Identifiant</label>
              <input
                id="username"
                type="text"
                class="form-input"
                [(ngModel)]="username"
                name="username"
                required
                placeholder="Ex: nom.utilisateur ou email"
                [disabled]="loading"
                autocomplete="username"
                autofocus
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Mot de passe</label>
              <div class="password-wrapper">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="form-input has-toggle"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  [disabled]="loading"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="toggle-password-btn"
                  (click)="showPassword = !showPassword"
                  [title]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  tabindex="-1"
                >
                  @if (!showPassword) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div class="options-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" class="custom-checkbox" />
                <span>Mémoriser mon identifiant</span>
              </label>
            </div>

            <button
              type="submit"
              class="btn-submit"
              [disabled]="loading || !username.trim() || !password.trim()"
            >
              @if (loading) {
                <span class="spinner-inline"></span>
                <span>Connexion en cours...</span>
              } @else {
                <span>Se connecter</span>
              }
            </button>

            <div class="forgot-wrapper">
              <button type="button" class="forgot-link" (click)="showForgotModal = true">
                Mot de passe oublié ?
              </button>
            </div>
          </form>

          <div class="form-footer-help">
            <span>Un problème de connexion ?</span>
            <button type="button" class="help-btn" (click)="showForgotModal = true">Contactez votre administrateur.</button>
          </div>

          <!-- Pied de page Copyright spécifique mobile -->
          <footer class="mobile-copyright">
            © {{ anneeCourante }} {{ nomEtablissement }} · Accès réservé au personnel autorisé
          </footer>
        </div>
      </section>

      <!-- VOLET DROIT (Desktop) / Haut (Mobile) : Panneau de présentation aux couleurs du projet (Jaune / Doré) -->
      <aside class="brand-section">
        <!-- Motifs décoratifs de fond en courbes et cercles légers -->
        <div class="decor-circles" aria-hidden="true">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>

        <div class="brand-content">
          <!-- En-tête : Badge Logo + Nom de l'établissement -->
          <div class="brand-badge-header">
            <div class="badge-avatar">
              @if (logoData) {
                <img [src]="logoData" alt="Logo" class="badge-logo-img" />
              } @else {
                <span class="avatar-letter">{{ initialesEtablissement }}</span>
              }
            </div>
            <div class="badge-meta">
              <span class="badge-name">{{ nomEtablissement }}</span>
              <span class="badge-sub">Gestion intégrée</span>
            </div>
          </div>

          <!-- Titre principal percutant et descriptif -->
          <div class="brand-hero">
            <h2 class="hero-title">Pilotez votre auto-école en toute maîtrise.</h2>
            <p class="hero-desc">
              Inscriptions, formation théorique, séances de conduite et suivi des examens réunis sur une seule plateforme.
            </p>
          </div>

          <!-- Liste des 3 atouts clés avec cartes translucides -->
          <div class="feature-cards">
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span class="feature-text">Parcours pédagogique & suivi des candidats (Code et Conduite)</span>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <span class="feature-text">Plannings, programmation d'examens et sessions officielles</span>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <span class="feature-text">Gestion de caisse, versements et traçabilité complète des opérations</span>
            </div>
          </div>

          <!-- Pied de page officiel du volet de marque (Desktop) -->
          <footer class="brand-footer">
            <span>© {{ anneeCourante }} {{ nomEtablissement }}</span>
            <span class="dot-sep">·</span>
            <span>Accès réservé au personnel autorisé</span>
          </footer>
        </div>
      </aside>

      <!-- MODAL ASSISTANCE / MOT DE PASSE OUBLIÉ -->
      @if (showForgotModal) {
        <div class="modal-backdrop" (click)="showForgotModal = false">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <h3>Assistance & Réinitialisation</h3>
            </div>
            <div class="modal-body">
              <p>Pour des raisons de sécurité, la réinitialisation de votre mot de passe doit être effectuée par un administrateur de votre établissement.</p>
              <div class="modal-info-box">
                <strong>Comment procéder ?</strong>
                <p>Veuillez contacter le secrétariat ou votre administrateur système en précisant votre nom et votre numéro de dossier / identifiant.</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-dialog-close" (click)="showForgotModal = false">Compris</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    /* Conteneur principal plein écran en 2 colonnes sur desktop */
    .login-wrapper {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    /* ========================================================
       VOLET FORMULAIRE D'IDENTIFICATION
       ======================================================== */
    .form-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(1.5rem, 4vh, 3.5rem) clamp(1.25rem, 3vw, 2.5rem);
      background: #f8fafc;
      min-width: 0;
      box-sizing: border-box;
    }

    .form-container {
      width: 100%;
      max-width: 440px;
      margin: 0 auto;
      box-sizing: border-box;
    }

    .form-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .form-title {
      font-size: clamp(1.65rem, 2.5vw, 2.15rem);
      font-weight: 800;
      color: #103778;
      margin: 0 0 0.5rem;
      letter-spacing: -0.025em;
    }

    .form-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    /* Alertes */
    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.9rem 1rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      font-size: 0.88rem;
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-text {
      flex: 1;
      line-height: 1.45;
    }

    .alert-close {
      background: none;
      border: none;
      color: #991b1b;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      opacity: 0.7;
      transition: opacity 0.15s;
    }

    .alert-close:hover { opacity: 1; }

    /* Formulaire */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .form-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .form-input {
      width: 100%;
      height: 48px;
      padding: 0 1rem;
      font-size: 1rem; /* 16px minimum pour empêcher le zoom auto iOS Safari */
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      transition: all 0.2s ease;
      box-sizing: border-box;
      -webkit-appearance: none;
    }

    .form-input:focus {
      outline: none;
      border-color: #fab825;
      box-shadow: 0 0 0 3px rgba(250, 184, 37, 0.25);
    }

    .form-input::placeholder {
      color: #94a3b8;
    }

    .form-input:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input.has-toggle {
      padding-right: 3.25rem;
    }

    .toggle-password-btn {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: color 0.15s;
      min-width: 44px;
      min-height: 44px;
    }

    .toggle-password-btn:hover {
      color: #0f172a;
    }

    .toggle-password-btn svg {
      width: 20px;
      height: 20px;
    }

    /* Options : Mémoriser */
    .options-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-top: -0.25rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
      color: #475569;
      cursor: pointer;
      user-select: none;
    }

    .custom-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #fab825;
    }

    /* Bouton principal de connexion */
    .btn-submit {
      width: 100%;
      height: 50px;
      margin-top: 0.5rem;
      background: linear-gradient(135deg, #fab825 0%, #f59e0b 100%);
      color: #103778;
      border: 1px solid #e2a014;
      border-radius: 10px;
      font-size: 1.02rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(250, 184, 37, 0.4);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
    }

    .btn-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, #f59e0b 0%, #e09e10 100%);
      color: #0c2b5e;
      box-shadow: 0 6px 20px rgba(250, 184, 37, 0.5);
      transform: translateY(-1px);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(250, 184, 37, 0.35);
    }

    .btn-submit:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      border: none;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }

    /* Lien Mot de passe oublié */
    .forgot-wrapper {
      text-align: center;
      margin-top: 0.25rem;
    }

    .forgot-link {
      background: none;
      border: none;
      color: #103778;
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .forgot-link:hover {
      color: #1d5cc7;
      text-decoration: underline;
    }

    /* Pied du formulaire */
    .form-footer-help {
      margin-top: 3.5rem;
      text-align: center;
      font-size: 0.86rem;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .help-btn {
      background: none;
      border: none;
      color: #103778;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      font-size: inherit;
    }

    .help-btn:hover {
      color: #1d5cc7;
    }

    .mobile-copyright {
      display: none;
    }

    .spinner-inline {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(16, 55, 120, 0.3);
      border-top-color: #103778;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ========================================================
       VOLET DE PRÉSENTATION JAUNE DORÉ (#fab825) & BLEU MARINE (#103778)
       ======================================================== */
    .brand-section {
      flex: 1.15;
      position: relative;
      background: linear-gradient(140deg, #fbc02d 0%, #fab825 40%, #f59e0b 80%, #e2a014 100%);
      padding: clamp(2rem, 5vh, 4.5rem) clamp(2rem, 4vw, 4rem);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      color: #103778;
      border-left: 1px solid #e2a014;
      box-shadow: inset 8px 0 24px rgba(16, 55, 120, 0.08);
      box-sizing: border-box;
      min-width: 0;
    }

    .decor-circles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid rgba(16, 55, 120, 0.1);
    }

    .circle-1 {
      width: 520px;
      height: 520px;
      bottom: -120px;
      right: -100px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
    }

    .circle-2 {
      width: 780px;
      height: 780px;
      bottom: -240px;
      right: -200px;
      border-color: rgba(16, 55, 120, 0.08);
    }

    .circle-3 {
      width: 1050px;
      height: 1050px;
      bottom: -360px;
      right: -300px;
      border-color: rgba(16, 55, 120, 0.05);
    }

    .brand-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      max-width: 620px;
    }

    /* Badge En-tête */
    .brand-badge-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .badge-avatar {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(16, 55, 120, 0.18);
      overflow: hidden;
      flex-shrink: 0;
      border: 1.5px solid rgba(255, 255, 255, 0.9);
    }

    .badge-logo-img {
      max-width: 85%;
      max-height: 85%;
      object-fit: contain;
    }

    .avatar-letter {
      color: #103778;
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .badge-meta {
      display: flex;
      flex-direction: column;
    }

    .badge-name {
      font-size: clamp(1.05rem, 1.4vw, 1.25rem);
      font-weight: 800;
      color: #103778;
      letter-spacing: -0.01em;
      line-height: 1.25;
    }

    .badge-sub {
      font-size: 0.85rem;
      color: #0c2b5e;
      font-weight: 600;
      opacity: 0.85;
    }

    /* Hero Titre & Sous-titre */
    .brand-hero {
      margin: 2rem 0 1.25rem;
    }

    .hero-title {
      font-size: clamp(1.5rem, 2.2vw, 2.25rem);
      font-weight: 800;
      color: #103778;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin: 0 0 0.75rem;
    }

    .hero-desc {
      font-size: clamp(0.88rem, 1vw, 1.02rem);
      color: #0c2b5e;
      line-height: 1.5;
      font-weight: 500;
      margin: 0;
      max-width: 520px;
      opacity: 0.95;
    }

    /* Cartes des fonctionnalités */
    .feature-cards {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      margin-bottom: 2.5rem;
    }

    .feature-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.15rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 6px 20px rgba(16, 55, 120, 0.08);
      transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }

    .feature-card:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateX(4px);
      box-shadow: 0 8px 24px rgba(16, 55, 120, 0.12);
    }

    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #103778;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #fab825;
      box-shadow: 0 3px 8px rgba(16, 55, 120, 0.2);
    }

    .feature-icon svg {
      width: 20px;
      height: 20px;
    }

    .feature-text {
      font-size: 0.92rem;
      font-weight: 700;
      color: #103778;
      line-height: 1.4;
    }

    /* Footer volet droit */
    .brand-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #0c2b5e;
      font-weight: 600;
      flex-wrap: wrap;
    }

    .dot-sep {
      opacity: 0.6;
    }

    /* ========================================================
       MODAL DE RÉINITIALISATION / ASSISTANCE
       ======================================================== */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.25rem;
      animation: fadeIn 0.2s ease-out;
      box-sizing: border-box;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      max-width: 460px;
      width: 100%;
      padding: 1.75rem;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.28);
      animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.25rem;
    }

    .modal-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #fef3c7;
      color: #b45309;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .modal-header-icon svg {
      width: 22px;
      height: 22px;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
    }

    .modal-body {
      font-size: 0.92rem;
      color: #475569;
      line-height: 1.55;
    }

    .modal-body p {
      margin: 0 0 1rem;
    }

    .modal-info-box {
      background: #f8fafc;
      border-left: 3px solid #fab825;
      padding: 0.85rem 1rem;
      border-radius: 0 8px 8px 0;
    }

    .modal-info-box strong {
      color: #0f172a;
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .modal-info-box p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .modal-footer {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    .btn-dialog-close {
      padding: 0.65rem 1.4rem;
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-dialog-close:hover {
      background: #1e293b;
    }

    /* ========================================================
       RESPONSIVE DESIGN ULTRA-OPTIMISÉ
       ======================================================== */

    /* 1. Laptops avec hauteur limitée (ex: ThinkPad L490, 1366x768, 1536x864 avec zoom) */
    @media (max-height: 820px) and (min-width: 901px) {
      .form-section {
        padding: 1.25rem 2rem;
      }
      .form-header {
        margin-bottom: 1.25rem;
      }
      .form-title {
        font-size: 1.75rem;
        margin-bottom: 0.25rem;
      }
      .login-form {
        gap: 0.9rem;
      }
      .form-input {
        height: 44px;
      }
      .btn-submit {
        height: 46px;
        margin-top: 0.25rem;
      }
      .form-footer-help {
        margin-top: 1.5rem;
      }
      .brand-section {
        padding: 2rem 2.5rem;
      }
      .brand-hero {
        margin: 1.25rem 0 0.85rem;
      }
      .hero-title {
        font-size: 1.75rem;
        margin-bottom: 0.4rem;
      }
      .hero-desc {
        font-size: 0.9rem;
      }
      .feature-cards {
        gap: 0.65rem;
        margin-bottom: 1.5rem;
      }
      .feature-card {
        padding: 0.65rem 1rem;
      }
      .feature-icon {
        width: 36px;
        height: 36px;
      }
      .feature-text {
        font-size: 0.88rem;
      }
    }

    /* 2. Écrans très courts en hauteur (hauteur < 680px, barres d'outils navigateur ouvertes) */
    @media (max-height: 680px) and (min-width: 901px) {
      .form-section {
        padding: 0.75rem 1.5rem;
      }
      .form-header {
        margin-bottom: 0.75rem;
      }
      .form-title {
        font-size: 1.5rem;
      }
      .form-subtitle {
        font-size: 0.85rem;
      }
      .login-form {
        gap: 0.75rem;
      }
      .form-input {
        height: 40px;
        font-size: 0.9rem;
      }
      .btn-submit {
        height: 42px;
        font-size: 0.95rem;
      }
      .form-footer-help {
        margin-top: 1rem;
        font-size: 0.8rem;
      }
      .brand-section {
        padding: 1.25rem 2rem;
      }
      .brand-hero {
        margin: 0.75rem 0 0.5rem;
      }
      .hero-title {
        font-size: 1.5rem;
      }
      .hero-desc {
        display: none;
      }
      .feature-cards {
        margin-bottom: 1rem;
        gap: 0.5rem;
      }
      .feature-card {
        padding: 0.5rem 0.85rem;
      }
    }

    /* 3. Tablettes moyennes en mode paysage (901px à 1100px) */
    @media (max-width: 1100px) and (min-width: 901px) {
      .brand-section {
        padding: 2rem 1.75rem;
      }
      .hero-title {
        font-size: 1.75rem;
      }
      .form-section {
        padding: 2rem 1.5rem;
      }
      .feature-card {
        padding: 0.75rem 0.9rem;
      }
    }

    /* 4. Tablettes portrait et Mobiles (< 901px) */
    @media (max-width: 900px) {
      .login-wrapper {
        flex-direction: column;
        min-height: 100vh;
        min-height: 100dvh;
        background: #f1f5f9;
      }

      /* Volet doré placé EN HAUT comme bannière hero */
      .brand-section {
        order: -1;
        flex: none;
        width: 100%;
        padding: 2.25rem 1.5rem 3rem;
        border-left: none;
        border-bottom: none;
        box-shadow: none;
        box-sizing: border-box;
      }

      .brand-content {
        max-width: 480px;
        margin: 0 auto;
        height: auto;
      }

      .brand-badge-header {
        justify-content: center;
        text-align: left;
      }

      .brand-hero {
        margin: 1.25rem 0 0;
        text-align: center;
      }

      .hero-title {
        font-size: 1.6rem;
        margin-bottom: 0.5rem;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.4);
      }

      .hero-desc {
        font-size: 0.92rem;
        margin: 0 auto;
      }

      .feature-cards {
        display: none;
      }

      .brand-footer {
        display: none;
      }

      /* Formulaire : carte blanche élégante avec coins arrondis qui chevauche la bannière dorée */
      .form-section {
        flex: 1;
        padding: 0 1.25rem 2.5rem;
        margin-top: -1.75rem;
        background: transparent;
        width: 100%;
        box-sizing: border-box;
        align-items: flex-start;
      }

      .form-container {
        max-width: 460px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 20px;
        padding: 2.25rem 1.75rem 1.75rem;
        box-shadow: 0 10px 25px -5px rgba(16, 55, 120, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
      }

      .form-header {
        margin-bottom: 1.5rem;
      }

      .form-title {
        font-size: 1.75rem;
      }

      .form-input {
        font-size: 16px; /* Empêche le zoom auto sur smartphone iOS */
        height: 50px;
      }

      .btn-submit {
        height: 50px;
        font-size: 1.05rem;
      }

      .form-footer-help {
        margin-top: 2rem;
      }

      .mobile-copyright {
        display: block;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
        text-align: center;
        font-size: 0.78rem;
        color: #94a3b8;
        line-height: 1.4;
      }
    }

    /* 5. Smartphones compacts (< 480px) */
    @media (max-width: 480px) {
      .brand-section {
        padding: 1.75rem 1rem 2.5rem;
      }

      .badge-avatar {
        width: 44px;
        height: 44px;
        border-radius: 11px;
      }

      .badge-name {
        font-size: 1.05rem;
      }

      .hero-title {
        font-size: 1.35rem;
      }

      .hero-desc {
        font-size: 0.85rem;
      }

      .form-section {
        padding: 0 0.85rem 1.5rem;
        margin-top: -1.25rem;
      }

      .form-container {
        padding: 1.5rem 1.2rem;
        border-radius: 16px;
      }

      .form-header {
        margin-bottom: 1.25rem;
      }

      .form-title {
        font-size: 1.5rem;
      }

      .form-subtitle {
        font-size: 0.88rem;
      }

      .form-input {
        height: 46px;
      }

      .btn-submit {
        height: 48px;
        font-size: 1rem;
      }

      .modal-dialog {
        padding: 1.25rem;
        border-radius: 14px;
      }
      .modal-header h3 {
        font-size: 1.1rem;
      }
    }

    /* 6. Mode paysage sur mobile à faible hauteur (< 540px) */
    @media (max-height: 540px) and (orientation: landscape) {
      .login-wrapper {
        min-height: auto;
        overflow-y: auto;
      }
      .brand-section {
        padding: 1rem 1.5rem;
      }
      .brand-hero {
        display: none;
      }
      .form-section {
        padding: 0.75rem 1.25rem 1.5rem;
        margin-top: 0;
      }
      .form-container {
        box-shadow: none;
        border: 1px solid #e2e8f0;
        padding: 1.25rem 1.5rem;
      }
      .form-header {
        margin-bottom: 0.75rem;
      }
      .form-footer-help {
        margin-top: 1rem;
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

  nomEtablissement = 'BARAKA AUTO MOTO ECOLE';
  logoData: string | null = null;
  anneeCourante = new Date().getFullYear();

  get initialesEtablissement(): string {
    if (!this.nomEtablissement) return 'AE';
    const words = this.nomEtablissement.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.hasRole(['CANDIDAT']) ? '/espace-candidat' : '/dashboard']);
    }
  }

  ngOnInit(): void {
    this.apiService.getIdentitePublique().subscribe({
      next: (id) => {
        this.nomEtablissement = id.nomEtablissement;
        this.logoData = id.logoData;
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
          this.errorMessage = 'Impossible de contacter le serveur Backend (port 8080). Assurez-vous que le backend et PostgreSQL sont bien démarrés.';
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
