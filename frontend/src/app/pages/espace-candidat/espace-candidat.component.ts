import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CodeProgression } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-espace-candidat',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <h2 style="display:flex; align-items:center; gap:0.5rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
        Code de la route — Ma progression
      </h2>
      <p>Bonjour {{ nomComplet }}, entraînez-vous Cycle par Cycle. Les questions restent toujours dans le même ordre.</p>
    </div>

    @if (loading) {
      <div class="card">Chargement de votre progression...</div>
    }

    @if (error) {
      <div class="alert alert-danger">{{ error }}</div>
    }

    @if (progression) {
      @if (progression.accesExpire) {
        <div class="alert alert-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          L'accès au module Code de la route a expiré pour votre inscription actuelle. Contactez le secrétariat.
        </div>
      }

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Cycles réussis</div>
            <div class="stat-value">{{ progression.cyclesReussis }} / {{ progression.totalCycles }}</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Progression</div>
            <div class="stat-value">{{ progression.pourcentageProgression | number:'1.0-1' }} %</div>
          </div>
        </div>
      </div>

      @if (progression.totalCycles === 0) {
        <div class="card">La banque de questions n'est pas encore disponible. Revenez plus tard.</div>
      }

      <div class="cycles-grid">
        @for (cycle of progression.cycles; track cycle.numeroCycle) {
          <div class="cycle-card" [class.locked]="cycle.statut === 'VERROUILLE'">
            <div class="cycle-header">
              <span class="cycle-title">Cycle {{ cycle.numeroCycle }}</span>
              <span class="badge" [ngClass]="badgeClass(cycle.statut)">{{ badgeLabel(cycle.statut) }}</span>
            </div>
            <div class="cycle-body">
              <div>{{ cycle.nombreQuestions }} questions</div>
              @if (cycle.meilleurScore !== undefined && cycle.meilleurScore !== null) {
                <div>Meilleur score : {{ cycle.meilleurScore }} / {{ cycle.nombreQuestions }}</div>
              }
              <div class="text-muted">Tentatives : {{ cycle.nbTentativesUtilisees }} / {{ cycle.tentativesMax }}</div>
            </div>
            <button
              class="btn btn-primary btn-sm"
              [disabled]="cycle.statut === 'VERROUILLE' || progression.accesExpire || demarrage"
              (click)="demarrer(cycle.numeroCycle)">
              @if (cycle.statut === 'VERROUILLE') {
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Verrouillé
                </span>
              }
              @if (cycle.statut === 'REUSSI') { Revoir / Refaire }
              @if (cycle.statut === 'ECHEC') { Reprendre le Cycle }
              @if (cycle.statut === 'DISPONIBLE') { Démarrer le Cycle }
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header p { color: var(--text-muted); }
    .cycles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .cycle-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .cycle-card.locked { opacity: 0.6; }
    .cycle-header { display: flex; align-items: center; justify-content: space-between; }
    .cycle-title { font-weight: 700; }
    .cycle-body { font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.2rem; }
    .text-muted { color: var(--text-muted); }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class EspaceCandidatComponent implements OnInit {
  progression: CodeProgression | null = null;
  loading = false;
  error = '';
  demarrage = false;

  constructor(private apiService: ApiService, private authService: AuthService, private router: Router) {}

  get nomComplet(): string {
    const u = this.authService.currentUserValue;
    return u ? `${u.prenom} ${u.nom}` : '';
  }

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    const candidatId = this.authService.currentUserValue?.candidatId;
    if (!candidatId) {
      this.error = "Aucun dossier candidat n'est associé à votre compte.";
      return;
    }
    this.loading = true;
    this.apiService.getCodeProgression(candidatId).subscribe({
      next: (res) => { this.loading = false; this.progression = res; },
      error: (err) => { this.loading = false; this.error = extraireMessageErreur(err, 'Impossible de charger votre progression.'); }
    });
  }

  demarrer(numeroCycle: number): void {
    this.demarrage = true;
    this.error = '';
    this.apiService.demarrerCycleCode(numeroCycle).subscribe({
      next: (etat) => {
        this.demarrage = false;
        if (etat.enCours) {
          this.router.navigate(['/espace-candidat/code', etat.enCours.tentativeId]);
        } else {
          this.charger();
        }
      },
      error: (err) => {
        this.demarrage = false;
        this.error = extraireMessageErreur(err, 'Impossible de démarrer ce Cycle.');
      }
    });
  }

  badgeClass(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'badge-solde';
      case 'ECHEC': return 'badge-echec';
      case 'VERROUILLE': return 'badge-expire';
      default: return 'badge-en-cours';
    }
  }

  badgeLabel(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'Réussi';
      case 'ECHEC': return 'Non réussi';
      case 'VERROUILLE': return 'Verrouillé';
      default: return 'Disponible';
    }
  }
}
