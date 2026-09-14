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
      <h2>🎓 Résultats — Code de la route</h2>
      <p>Consultez la progression, les Cycles et l'historique des tentatives des candidats autorisés.</p>
    </div>

    <!-- RECHERCHE / LISTE DES CANDIDATS AUTORISÉS -->
    <div class="card filter-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
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

    <div class="card table-card">
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Candidat</th>
              <th>Catégorie</th>
              <th>Site</th>
              <th>Étape</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (c of candidats; track c.id) {
              <tr [class.selected-row]="candidatSelectionne?.id === c.id">
                <td><code>{{ c.numeroDossier }}</code></td>
                <td>{{ c.nom }} {{ c.prenom }}</td>
                <td>{{ c.categoriePermisCode }}</td>
                <td>{{ c.siteNom || '—' }}</td>
                <td>{{ c.etapeParcours }}</td>
                <td class="text-right">
                  <button class="btn btn-sm btn-primary" (click)="selectionner(c)">Voir le Code</button>
                </td>
              </tr>
            }
            @if (candidats.length === 0 && !loadingListe) {
              <tr><td colspan="6" class="text-muted">Aucun candidat autorisé ne correspond à cette recherche.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages > 1) {
        <div class="pagination-bar">
          <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changerPage(page - 1)">← Précédent</button>
          <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} candidats)</span>
          <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changerPage(page + 1)">Suivant →</button>
        </div>
      }
    </div>

    <!-- DÉTAIL DU CANDIDAT SÉLECTIONNÉ -->
    @if (candidatSelectionne) {
      <div class="card detail-card">
        <div class="card-header">
          <div class="card-title">
            {{ candidatSelectionne.nom }} {{ candidatSelectionne.prenom }}
            <span class="text-muted">— {{ candidatSelectionne.numeroDossier }}</span>
          </div>
          <button class="btn btn-outline btn-sm" (click)="fermerDetail()">✕ Fermer</button>
        </div>

        @if (loadingDetail) {
          <p>Chargement des données Code de la route...</p>
        }

        @if (erreurDetail) {
          <div class="alert alert-danger">{{ erreurDetail }}</div>
        }

        @if (progression) {
          @if (progression.accesExpire) {
            <div class="alert alert-warning">⚠️ L'accès au module Code de la route a expiré pour ce candidat.</div>
          }

          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon primary">🔄</div>
              <div class="stat-info">
                <div class="stat-label">Cycles réussis</div>
                <div class="stat-value">{{ progression.cyclesReussis }} / {{ progression.totalCycles }}</div>
              </div>
            </div>
            <div class="stat-card success">
              <div class="stat-icon success">📈</div>
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
                  <tr><td colspan="5" class="text-muted">Aucun Cycle disponible (banque de questions vide).</td></tr>
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
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header p { color: var(--text-muted); }
    .text-muted { color: var(--text-muted); }
    .text-right { text-align: right; }
    .pagination-bar { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; }
    .detail-card { margin-top: 1.5rem; }
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
