import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CodeHistoriqueLigne } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-code-historique',
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Historique — Code de la route</h2>
      <p>Toutes vos tentatives, Cycle par Cycle.</p>
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
