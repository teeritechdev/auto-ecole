import { Component, OnInit } from '@angular/core';
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
          <h2>Bonjour, {{ currentUser?.nom }} {{ currentUser?.prenom }} 👋</h2>
          <p>Bienvenue sur votre espace de gestion <strong>Nerwaya Auto-École</strong> (Profil : <span class="role-badge">{{ currentUser?.role }}</span>)</p>
        </div>
        <div class="quick-actions">
          <a routerLink="/candidats" class="btn btn-primary btn-sm" *ngIf="hasRole(['ADMIN', 'SECRETAIRE'])">
            ➕ Nouveau Candidat
          </a>
          <a routerLink="/paiements" class="btn btn-success btn-sm" *ngIf="hasRole(['ADMIN', 'CAISSIERE'])">
            💵 Nouvel Encaissement
          </a>
          <a routerLink="/caisse" class="btn btn-secondary btn-sm" *ngIf="hasRole(['ADMIN', 'CAISSIERE'])">
            🏦 Journal Caisse
          </a>
        </div>
      </div>

      <!-- ALERTE EXPIRATION SI EXISTANTE -->
      <div *ngIf="stats?.alertesExpiration && stats!.alertesExpiration.length > 0" class="alert alert-warning">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>Attention — {{ stats!.alertesExpiration.length }} dossier(s) proche(s) de l'expiration (RG05 - Validité 8 mois) :</strong>
          <div class="alert-list">
            <span *ngFor="let c of stats!.alertesExpiration" class="alert-tag">
              {{ c.numeroDossier }} ({{ c.nom }} {{ c.prenom }}) - Reste {{ c.joursRestants }} j.
            </span>
          </div>
        </div>
      </div>

      <!-- KPI STATS CARDS -->
      <div class="stats-grid">
        <!-- 1. Total Candidats -->
        <div class="stat-card primary">
          <div class="stat-icon primary">👥</div>
          <div class="stat-info">
            <div class="stat-label">Total Candidats</div>
            <div class="stat-value">{{ stats?.totalCandidats || 0 }}</div>
            <div class="stat-sub">
              <span>{{ stats?.candidatsEnCours || 0 }} en cours</span> • 
              <span class="text-success">{{ stats?.candidatsSoldes || 0 }} soldés</span>
            </div>
          </div>
        </div>

        <!-- 2. Montant Total Encaissé -->
        <div class="stat-card success" *ngIf="hasRole(['ADMIN', 'CAISSIERE', 'SECRETAIRE'])">
          <div class="stat-icon success">💰</div>
          <div class="stat-info">
            <div class="stat-label">Total Encaissé</div>
            <div class="stat-value">{{ (stats?.montantTotalEncaisse || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub text-danger">
              Reste dû : {{ (stats?.montantGlobalRestantDu || 0) | number }} FCFA
            </div>
          </div>
        </div>

        <!-- 3. Solde Caisse Actuel -->
        <div class="stat-card info" *ngIf="hasRole(['ADMIN', 'CAISSIERE'])">
          <div class="stat-icon info">🏦</div>
          <div class="stat-info">
            <div class="stat-label">Solde de Caisse</div>
            <div class="stat-value">{{ (stats?.soldeCaisseActuel || 0) | number }} <small>FCFA</small></div>
            <div class="stat-sub">
              Entrées : {{ (stats?.totalEntreesCaisse || 0) | number }} FCFA
            </div>
          </div>
        </div>

        <!-- 4. Réussite Examens -->
        <div class="stat-card warning">
          <div class="stat-icon warning">🎓</div>
          <div class="stat-info">
            <div class="stat-label">Examens Pédagogiques</div>
            <div class="stat-value">{{ stats?.totalExamensReussis || 0 }} <small>réussis</small></div>
            <div class="stat-sub">
              {{ stats?.totalExamensProgrammes || 0 }} programmés • {{ stats?.totalExamensEchecs || 0 }} échecs
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN DASHBOARD CONTENT (2 COLUMNS) -->
      <div class="dashboard-grid">
        <!-- Prochains Examens -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📅 Prochains Examens Programmés</div>
            <a routerLink="/examens" class="btn btn-outline btn-sm">Voir tout</a>
          </div>
          
          <div *ngIf="!stats?.prochainsExamens || stats!.prochainsExamens.length === 0" class="empty-state">
            Aucun examen programmé pour les prochains jours.
          </div>

          <div *ngIf="stats?.prochainsExamens && stats!.prochainsExamens.length > 0" class="table-responsive">
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
                <tr *ngFor="let ex of stats!.prochainsExamens">
                  <td><strong>{{ ex.datePassage | date:'dd/MM/yyyy' }}</strong></td>
                  <td>{{ ex.candidatNomComplet }} ({{ ex.candidatNumeroDossier }})</td>
                  <td><span class="badge badge-programme">{{ ex.typeEpreuve }}</span></td>
                  <td>Passage n°{{ ex.numeroPassage }}/5</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-programme': ex.resultat === 'PROGRAMME',
                      'badge-reussi': ex.resultat === 'REUSSI',
                      'badge-echec': ex.resultat === 'ECHEC',
                      'badge-ajourne': ex.resultat === 'AJOURNE'
                    }">{{ ex.resultat }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Derniers Encaissements -->
        <div class="card" *ngIf="hasRole(['ADMIN', 'CAISSIERE', 'SECRETAIRE'])">
          <div class="card-header">
            <div class="card-title">💵 Derniers Versements Enregistrés</div>
            <a routerLink="/paiements" class="btn btn-outline btn-sm">Voir tout</a>
          </div>

          <div *ngIf="!stats?.derniersPaiements || stats!.derniersPaiements.length === 0" class="empty-state">
            Aucun versement enregistré.
          </div>

          <div *ngIf="stats?.derniersPaiements && stats!.derniersPaiements.length > 0" class="table-responsive">
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
                <tr *ngFor="let p of stats!.derniersPaiements">
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
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

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadStats();
  }

  loadStats(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Erreur chargement stats:', err)
    });
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
