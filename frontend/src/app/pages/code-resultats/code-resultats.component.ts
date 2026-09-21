import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Candidat, CodeProgression, CodeHistoriqueLigne } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

/**
 * Consultation, par le personnel autorisé (ADMIN, MONITEUR), de la progression et de
 * l'historique du module Code de la route d'un candidat. Réutilise :
 * - GET /api/candidats (déjà utilisé par la page Candidats) pour la liste des candidats
 *   autorisés : le backend y applique déjà la restriction par site (et par étape de
 *   parcours) du Moniteur (SiteAccessService) — aucune nouvelle règle d'accès introduite ici ;
 * - GET /api/code/progression/{id} et /api/code/historique/{id} (déjà utilisés par l'espace
 *   candidat), qui appliquent déjà la même restriction par site pour un Moniteur.
 * Aucun nouvel endpoint backend n'a été nécessaire.
 */
@Component({
  selector: 'app-code-resultats',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2 style="display:flex; align-items:center; gap:0.5rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
        Résultats — Code de la route
      </h2>
      <p>Consultez la progression, les Cycles et l'historique des tentatives des inscrits autorisés.</p>
    </div>

    <!-- RECHERCHE / LISTE DES CANDIDATS AUTORISÉS -->
    <div class="card filter-card">
      <div class="search-box">
        <span class="search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input
          type="text"
          class="form-control"
          placeholder="Rechercher par nom, prénom, N° dossier, téléphone..."
          [(ngModel)]="recherche"
          (keyup.enter)="chargerCandidats()"
        />
      </div>
    </div>

    @if (erreurListe) {
      <div class="alert alert-danger">{{ erreurListe }}</div>
    }

    <!-- TABLE -->
    <div class="card">
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Nom & Prénom</th>
              <th>Téléphone</th>
              <th>Permis</th>
              <th>Étape</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (c of candidats; track c.id) {
              <tr>
                <td><strong>{{ c.numeroDossier }}</strong></td>
                <td>{{ c.nom }} {{ c.prenom }}</td>
                <td>{{ c.telephone }}</td>
                <td><span class="badge badge-outline">{{ c.categoriePermisCode }}</span></td>
                <td>{{ c.etapeParcours }}</td>
                <td class="text-right">
                  <button class="btn btn-sm btn-primary" (click)="selectionner(c)">Voir le Code</button>
                </td>
              </tr>
            }
            @if (candidats.length === 0 && !loadingListe) {
              <tr><td colspan="6" class="text-muted">Aucun inscrit autorisé ne correspond à cette recherche.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages > 1) {
        <div class="pagination-bar">
          <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changerPage(page - 1)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Précédent
          </button>
          <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} inscrits)</span>
          <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changerPage(page + 1)">
            Suivant
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      }
    </div>

    <!-- DÉTAIL DU CANDIDAT SÉLECTIONNÉ -->
    @if (candidatSelectionne) {
      <div class="modal-backdrop" (click)="fermerDetail()">
      <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 style="display:flex; align-items:center; gap:0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
            {{ candidatSelectionne.nom }} {{ candidatSelectionne.prenom }}
            <span class="text-muted">— {{ candidatSelectionne.numeroDossier }}</span>
          </h3>
          <button class="btn btn-outline btn-sm" (click)="fermerDetail()">✕</button>
        </div>
        <div class="modal-body">

        @if (loadingDetail) {
          <p>Chargement des données Code de la route...</p>
        }

        @if (erreurDetail) {
          <div class="alert alert-danger">{{ erreurDetail }}</div>
        }

        @if (progression) {
          @if (progression.accesExpire) {
            <div class="alert alert-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              L'accès au module Code de la route a expiré pour ce candidat.
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

          <h4 class="section-title">Cycles</h4>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Questions</th>
                  <th>Statut</th>
                  <th>Meilleur score</th>
                  <th>Tentatives utilisées</th>
                </tr>
              </thead>
              <tbody>
                @for (cycle of progression.cycles; track cycle.numeroCycle) {
                  <tr>
                    <td>Cycle {{ cycle.numeroCycle }}</td>
                    <td>{{ cycle.nombreQuestions }}</td>
                    <td><span class="badge" [ngClass]="badgeClassCycle(cycle.statut)">{{ badgeLabelCycle(cycle.statut) }}</span></td>
                    <td>{{ cycle.meilleurScore ?? '—' }}</td>
                    <td>{{ cycle.nbTentativesUtilisees }} / {{ cycle.tentativesMax }}</td>
                  </tr>
                }
                @if (progression.cycles.length === 0) {
                  <tr><td colspan="5" class="text-muted">Aucun Cycle disponible (Quiz Exercice vide).</td></tr>
                }
              </tbody>
            </table>
          </div>

          <h4 class="section-title">Historique des tentatives</h4>
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
                @for (ligne of historique; track ligne.tentativeId) {
                  <tr>
                    <td>Cycle {{ ligne.numeroCycle }}</td>
                    <td>#{{ ligne.numeroTentative }}</td>
                    <td>{{ ligne.dateDebut | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ ligne.score }} / {{ ligne.totalQuestions }}</td>
                    <td><span class="badge" [ngClass]="badgeClassTentative(ligne.statut)">{{ badgeLabelTentative(ligne.statut) }}</span></td>
                  </tr>
                }
                @if (historique.length === 0) {
                  <tr><td colspan="5" class="text-muted">Aucune tentative enregistrée pour le moment.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
        </div>
      </div>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header h2 {
      color: var(--primary);
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    .page-header p { color: var(--text-muted); }
    .text-muted { color: var(--text-muted); }
    .text-right { text-align: right; }
    .pagination-bar { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; }
    .section-title { margin: 1.5rem 0 0.75rem; font-size: 1rem; }
    .selected-row { background: var(--primary-light); }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class CodeResultatsComponent implements OnInit {
  candidats: Candidat[] = [];
  loadingListe = false;
  erreurListe = '';
  recherche = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  candidatSelectionne: Candidat | null = null;
  progression: CodeProgression | null = null;
  historique: CodeHistoriqueLigne[] = [];
  loadingDetail = false;
  erreurDetail = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.chargerCandidats();
  }

  chargerCandidats(): void {
    this.loadingListe = true;
    this.erreurListe = '';
    this.apiService.getCandidats(this.recherche, undefined, undefined, this.page, 10, undefined, true).subscribe({
      next: (res) => {
        this.candidats = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        this.loadingListe = false;
      },
      error: (err) => {
        this.loadingListe = false;
        this.erreurListe = extraireMessageErreur(err, 'Impossible de charger la liste des candidats.');
      }
    });
  }

  changerPage(p: number): void {
    this.page = p;
    this.chargerCandidats();
  }

  selectionner(c: Candidat): void {
    this.candidatSelectionne = c;
    this.progression = null;
    this.historique = [];
    this.erreurDetail = '';
    this.loadingDetail = true;

    this.apiService.getCodeProgression(c.id).subscribe({
      next: (res) => {
        this.progression = res;
        this.chargerHistorique(c.id);
      },
      error: (err) => {
        this.loadingDetail = false;
        this.erreurDetail = extraireMessageErreur(err, 'Impossible de charger la progression Code de ce candidat.');
      }
    });
  }

  private chargerHistorique(candidatId: number): void {
    this.apiService.getCodeHistorique(candidatId).subscribe({
      next: (res) => {
        this.historique = res;
        this.loadingDetail = false;
      },
      error: (err) => {
        this.loadingDetail = false;
        this.erreurDetail = extraireMessageErreur(err, "Impossible de charger l'historique Code de ce candidat.");
      }
    });
  }

  fermerDetail(): void {
    this.candidatSelectionne = null;
    this.progression = null;
    this.historique = [];
    this.erreurDetail = '';
  }

  badgeClassCycle(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'badge-solde';
      case 'ECHEC': return 'badge-echec';
      case 'VERROUILLE': return 'badge-expire';
      default: return 'badge-en-cours';
    }
  }

  badgeLabelCycle(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'Réussi';
      case 'ECHEC': return 'Non réussi';
      case 'VERROUILLE': return 'Verrouillé';
      default: return 'Disponible';
    }
  }

  badgeClassTentative(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'badge-solde';
      case 'ECHEC': return 'badge-echec';
      case 'EXPIREE': return 'badge-expire';
      default: return 'badge-en-cours';
    }
  }

  badgeLabelTentative(statut: string): string {
    switch (statut) {
      case 'REUSSI': return 'Réussi';
      case 'ECHEC': return 'Non réussi';
      case 'EXPIREE': return 'Temps écoulé';
      case 'ABANDONNEE': return 'Abandonnée';
      default: return 'En cours';
    }
  }
}
