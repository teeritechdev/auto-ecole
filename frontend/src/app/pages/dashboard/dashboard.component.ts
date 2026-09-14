import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/models';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-page">
      <!-- HEADER BANNER -->
      <div class="welcome-banner">
        <div>
          <h2>Bonjour, {{ currentUser?.nom }} {{ currentUser?.prenom }}</h2>
          <p>Bienvenue sur votre espace de gestion <strong>Nerwaya Auto-École</strong> (Profil : <span class="role-badge">{{ currentUser?.role }}</span>)</p>
        </div>
        <div class="quick-actions">
          <button class="btn btn-outline btn-sm" [disabled]="loadingStats" (click)="loadStats()" style="color: white; border-color: rgba(255,255,255,0.5);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            {{ loadingStats ? 'Actualisation...' : 'Actualiser' }}
          </button>
          @if (hasRole(['ADMIN', 'SECRETAIRE'])) {
            <a routerLink="/candidats" class="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
              Nouveau Candidat
            </a>
          }
          @if (hasRole(['ADMIN', 'CAISSIERE'])) {
            <a routerLink="/paiements" class="btn btn-success btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Nouvel Encaissement
            </a>
          }
          @if (hasRole(['ADMIN', 'CAISSIERE'])) {
            <a routerLink="/caisse" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
              Journal Caisse
            </a>
          }
        </div>
      </div>

      <!-- ALERTE EXPIRATION SI EXISTANTE -->
      @if (stats?.alertesExpiration && stats!.alertesExpiration.length > 0) {
        <div class="alert alert-warning">
          <div class="alert-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="alert-content">
            <strong>Attention — {{ stats!.alertesExpiration.length }} dossier(s) proche(s) de l'expiration (RG05 - Validité 8 mois) :</strong>
            <div class="alert-list">
              @for (c of stats!.alertesExpiration; track c) {
                <span class="alert-tag">
                  {{ c.numeroDossier }} ({{ c.nom }} {{ c.prenom }}) - Reste {{ c.joursRestants }} j.
                </span>
              }
            </div>
          </div>
        </div>
      }
    
      <!-- KPI STATS CARDS -->
      <div class="stats-grid">
        <!-- 1. Total Candidats -->
        <div class="stat-card primary">
          <div class="stat-icon primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Candidats</div>
            <div class="stat-value">{{ stats?.totalCandidats || 0 }}</div>
            <div class="stat-sub">
              <span>{{ stats?.candidatsEnCours || 0 }} en cours</span> •
              <span class="text-success">{{ stats?.candidatsSoldes || 0 }} soldés</span> •
              <span class="text-danger">{{ stats?.candidatsExpiresNonSoldes || 0 }} expirés non soldés</span>
            </div>
          </div>
        </div>
    
        <!-- 2. Montant Total Encaissé -->
        @if (hasRole(['ADMIN', 'CAISSIERE', 'SECRETAIRE'])) {
          <div class="stat-card success">
            <div class="stat-icon success">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Encaissé</div>
              <div class="stat-value">{{ (stats?.montantTotalEncaisse || 0) | number }} <small>FCFA</small></div>
              <div class="stat-sub text-danger">
                Reste dû : {{ (stats?.montantGlobalRestantDu || 0) | number }} FCFA
              </div>
            </div>
          </div>
        }
    
        <!-- 3. Solde Caisse Actuel -->
        @if (hasRole(['ADMIN', 'CAISSIERE'])) {
          <div class="stat-card info">
            <div class="stat-icon info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Solde de Caisse</div>
              <div class="stat-value">{{ (stats?.soldeCaisseActuel || 0) | number }} <small>FCFA</small></div>
              <div class="stat-sub">
                Entrées : {{ (stats?.totalEntreesCaisse || 0) | number }} FCFA
              </div>
            </div>
          </div>
        }
    
        <!-- 4. Réussite Examens -->
        <div class="stat-card warning">
          <div class="stat-icon warning">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Examens Pédagogiques</div>
            <div class="stat-value">{{ stats?.totalExamensReussis || 0 }} <small>réussis</small></div>
            <div class="stat-sub">
              {{ stats?.totalExamensProgrammes || 0 }} programmés • {{ stats?.totalExamensEchecs || 0 }} ajournés
            </div>
          </div>
        </div>
      </div>
    
      <!-- MAIN DASHBOARD CONTENT (2 COLUMNS) -->
      <div class="dashboard-grid">
        <!-- Prochains Examens -->
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Prochains Examens Programmés
            </div>
            <a routerLink="/examens" class="btn btn-outline btn-sm">Voir tout</a>
          </div>
    
          @if (!stats?.prochainsExamens || stats!.prochainsExamens.length === 0) {
            <div class="empty-state">
              Aucun examen programmé pour les prochains jours.
            </div>
          }
    
          @if (stats?.prochainsExamens && stats!.prochainsExamens.length > 0) {
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Candidat</th>
                    <th>Épreuve</th>
                    <th>Passage</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ex of stats!.prochainsExamens; track ex) {
                    <tr>
                      <td><strong>{{ ex.datePassage | date:'dd/MM/yyyy' }}</strong></td>
                      <td>{{ ex.candidatNomComplet }} ({{ ex.candidatNumeroDossier }})</td>
                      <td><span class="badge badge-programme">{{ ex.typeEpreuve }}</span></td>
                      <td>Passage n°{{ ex.numeroPassage }}/5</td>
                      <td>
                    <span class="badge" [ngClass]="{
                      'badge-programme': ex.resultat === 'PROGRAMME',
                      'badge-reussi': ex.resultat === 'REUSSI',
                      'badge-ajourne': ex.resultat === 'AJOURNE'
                    }">{{ ex.resultat }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
    
        <!-- Derniers Encaissements -->
        @if (hasRole(['ADMIN', 'CAISSIERE', 'SECRETAIRE'])) {
          <div class="card">
            <div class="card-header">
              <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Derniers Versements Enregistrés
              </div>
              <a routerLink="/paiements" class="btn btn-outline btn-sm">Voir tout</a>
            </div>
            @if (!stats?.derniersPaiements || stats!.derniersPaiements.length === 0) {
              <div class="empty-state">
                Aucun versement enregistré.
              </div>
            }
            @if (stats?.derniersPaiements && stats!.derniersPaiements.length > 0) {
              <div class="table-responsive">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>N° Reçu</th>
                      <th>Candidat</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of stats!.derniersPaiements; track p) {
                      <tr>
                        <td><strong>{{ p.numeroRecu || '-' }}</strong></td>
                        <td>{{ p.candidatNomComplet }}</td>
                        <td><strong class="text-success">{{ p.montant | number }} FCFA</strong></td>
                        <td>{{ p.modeReglement }}</td>
                        <td>
                    <span class="badge" [ngClass]="{
                      'badge-solde': p.statut === 'VALIDE',
                      'badge-expire': p.statut === 'ANNULE',
                      'badge-ajourne': p.statut === 'MODIFIE'
                    }">{{ p.statut }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      </div>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .welcome-banner {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem 1.75rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.25);
    }

    .welcome-banner h2 {
      color: white;
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
    }

    .welcome-banner p {
      color: #bfdbfe;
      font-size: 0.9rem;
    }

    .role-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      color: #ffffff;
    }

    .quick-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .alert-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .alert-tag {
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #92400e;
    }

    .stat-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 1.5rem;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  currentUser: any = null;
  loadingStats = false;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadStats();
  }

  loadStats(): void {
    this.loadingStats = true;
    this.apiService.getDashboardStats().subscribe({
      next: (res) => { this.stats = res; this.loadingStats = false; },
      error: (err) => { console.error('Erreur chargement stats:', err); this.loadingStats = false; }
    });
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
