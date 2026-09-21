import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CodeHistoriqueLigne } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-code-historique',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
      <div>
        <h2 style="margin:0;">Historique — Code de la route</h2>
        <p style="margin:0.25rem 0 0 0;">Toutes vos tentatives, Cycle par Cycle.</p>
      </div>
      <div>
        <a routerLink="/espace-candidat" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:0.4rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Mon Dossier & Suivi Examens
        </a>
      </div>
    </div>

    @if (error) {
      <div class="alert alert-danger">{{ error }}</div>
    }

    <div class="card">
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Tentative</th>
              <th>Date</th>
              <th>Score</th>
              <th>Résultat</th>
            </tr>
          </thead>
          <tbody>
            @for (ligne of lignes; track ligne.tentativeId) {
              <tr>
                <td>Cycle {{ ligne.numeroCycle }}</td>
                <td>#{{ ligne.numeroTentative }}</td>
                <td>{{ ligne.dateDebut | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ ligne.score }} / {{ ligne.totalQuestions }}</td>
                <td><span class="badge" [ngClass]="badgeClass(ligne.statut)">{{ badgeLabel(ligne.statut) }}</span></td>
              </tr>
            }
            @if (lignes.length === 0 && !loading) {
              <tr><td colspan="5" class="text-muted">Aucune tentative pour le moment.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header p { color: var(--text-muted); }
    .text-muted { color: var(--text-muted); text-align: center; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class CodeHistoriqueComponent implements OnInit {
  lignes: CodeHistoriqueLigne[] = [];
  loading = false;
  error = '';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    const candidatId = this.authService.currentUserValue?.candidatId;
    if (!candidatId) {
      this.error = "Aucun dossier candidat n'est associé à votre compte.";
      return;
    }
    this.loading = true;
    this.apiService.getCodeHistorique(candidatId).subscribe({
      next: (res) => { this.loading = false; this.lignes = res; },
      error: (err) => { this.loading = false; this.error = extraireMessageErreur(err, "Impossible de charger l'historique."); }
    });
  }

  badgeClass(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'badge-solde';
      case 'ECHEC': return 'badge-echec';
      case 'EXPIREE': return 'badge-expire';
      default: return 'badge-en-cours';
    }
  }

  badgeLabel(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'Réussi';
      case 'ECHEC': return 'Non réussi';
      case 'EXPIREE': return 'Temps écoulé';
      case 'ABANDONNEE': return 'Abandonnée';
      default: return 'En cours';
    }
  }
}
