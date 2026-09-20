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
      <!-- HEADER DISCRET -->
      <div class="dashboard-header-bar">
        <div>
          <h2 class="dashboard-title">Bienvenue sur votre espace de gestion</h2>
          <p class="dashboard-subtitle">{{ currentUser?.nom }} {{ currentUser?.prenom }} • Profil : <span class="role-badge">{{ currentUser?.role }}</span></p>
        </div>
        <button class="refresh-btn" [class.spinning]="loadingStats" [disabled]="loadingStats" (click)="loadStats()" title="Actualiser les statistiques">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </button>
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
        @if (isStatVisible('candidats')) {
          <div class="stat-card primary">
            <button type="button" class="stat-action-btn" (click)="openSiteModal('candidats')" title="Voir détail par site">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <div class="stat-info">
              <div class="stat-label">Total Candidats</div>
              <div class="stat-value">{{ stats?.totalCandidats || 0 }}</div>
              <div class="stat-sub">
                <span>{{ stats?.candidatsEnCours || 0 }} en cours</span> •
                <span class="text-success">{{ stats?.candidatsSoldes || 0 }} soldés</span> •
                <span class="text-danger">{{ stats?.candidatsExpiresNonSoldes || 0 }} expirés non soldés</span>
              </div>
              <div class="stat-sub">
                {{ stats?.totalHommes || 0 }} hommes • {{ stats?.totalFemmes || 0 }} femmes
              </div>
            </div>
          </div>
        }

        <!-- 2. Montant Total Encaissé -->
        @if (isStatVisible('financier')) {
          <div class="stat-card success">
            <button type="button" class="stat-action-btn" (click)="openSiteModal('financier')" title="Voir détail par site">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
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
        @if (isStatVisible('caisse')) {
          <div class="stat-card info">
            <button type="button" class="stat-action-btn" (click)="openSiteModal('caisse')" title="Voir détail par site">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <div class="stat-info">
              <div class="stat-label">Solde de Caisse</div>
              <div class="stat-value">{{ (stats?.soldeCaisseActuel || 0) | number }} <small>FCFA</small></div>
              <div class="stat-sub">
                Entrées : {{ (stats?.totalEntreesCaisse || 0) | number }} FCFA •
                Sorties : {{ (stats?.totalSortiesCaisse || 0) | number }} FCFA
              </div>
            </div>
          </div>
        }

        <!-- 4. Réussite Examens -->
        @if (isStatVisible('examens')) {
          <div class="stat-card warning">
            <button type="button" class="stat-action-btn" (click)="openSiteModal('examens')" title="Voir détail par site">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <div class="stat-info">
              <div class="stat-label">Examens Pédagogiques</div>
              <div class="stat-value">{{ stats?.totalExamensReussis || 0 }} <small>réussis</small></div>
              <div class="stat-sub">
                {{ stats?.totalExamensProgrammes || 0 }} programmés • {{ stats?.totalExamensEchecs || 0 }} ajournés
              </div>
            </div>
          </div>
        }
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
                    <th>Candidat</th>
                    <th>Épreuve</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ex of (stats!.prochainsExamens | slice:0:3); track ex) {
                    <tr>
                      <td>
                        <strong>{{ ex.candidatNomComplet }}</strong>
                        <div class="sub-text">{{ ex.datePassage | date:'dd/MM/yyyy' }}</div>
                      </td>
                      <td><span class="badge badge-programme">{{ ex.typeEpreuve }}</span></td>
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
                      <th>Candidat</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of (stats!.derniersPaiements | slice:0:3); track p) {
                      <tr>
                        <td>
                          <strong>{{ p.candidatNomComplet }}</strong>
                          <div class="sub-text">{{ p.numeroRecu || '-' }}</div>
                        </td>
                        <td><strong class="text-success">{{ p.montant | number }} FCFA</strong></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- Dernières Transactions de Caisse -->
        @if (hasRole(['ADMIN', 'CAISSIERE'])) {
          <div class="card">
            <div class="card-header">
              <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
                Dernières Transactions de Caisse
              </div>
              <a routerLink="/caisse" class="btn btn-outline btn-sm">Voir tout</a>
            </div>
            @if (!stats?.dernieresTransactionsCaisse || stats!.dernieresTransactionsCaisse.length === 0) {
              <div class="empty-state">
                Aucune transaction de caisse enregistrée.
              </div>
            }
            @if (stats?.dernieresTransactionsCaisse && stats!.dernieresTransactionsCaisse.length > 0) {
              <div class="table-responsive">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Libellé</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of (stats!.dernieresTransactionsCaisse | slice:0:3); track t) {
                      <tr>
                        <td>
                          <strong>{{ t.libelle }}</strong>
                          <div class="sub-text">{{ t.dateTransaction | date:'dd/MM/yyyy' }}</div>
                        </td>
                        <td>
                          <strong [ngClass]="t.typeMouvement === 'ENTREE' ? 'text-success' : 'text-danger'">
                            {{ t.typeMouvement === 'ENTREE' ? '+' : '-' }} {{ t.montant | number }} FCFA
                          </strong>
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

      <!-- MODALE DÉTAILS TOTAUX PAR SITE -->
      @if (activeSiteModal) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Détail par Site — {{ modalTitle }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="closeSiteModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (!stats?.statsParSite || stats!.statsParSite!.length === 0) {
                <div class="empty-state">
                  Aucune donnée par site disponible.
                </div>
              }
              @if (stats?.statsParSite && stats!.statsParSite!.length > 0) {
                <div class="table-responsive">
                  <table class="custom-table">
                    <thead>
                      <tr>
                        <th>Site</th>
                        @if (activeSiteModal === 'candidats') {
                          <th>Total Candidats</th>
                          <th>En cours</th>
                          <th>Soldés</th>
                          <th>Expirés non soldés</th>
                        }
                        @if (activeSiteModal === 'financier') {
                          <th>Total Encaissé</th>
                          <th>Reste Dû</th>
                        }
                        @if (activeSiteModal === 'caisse') {
                          <th>Entrées</th>
                          <th>Sorties</th>
                          <th>Solde Caisse</th>
                        }
                        @if (activeSiteModal === 'examens') {
                          <th>Réussis</th>
                          <th>Ajournés</th>
                          <th>Programmés</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of stats!.statsParSite; track s.siteId) {
                        <tr>
                          <td><strong>{{ s.siteNom }}</strong></td>
                          @if (activeSiteModal === 'candidats') {
                            <td><strong>{{ s.totalCandidats }}</strong></td>
                            <td>{{ s.candidatsEnCours }}</td>
                            <td><span class="text-success font-weight-bold">{{ s.candidatsSoldes }}</span></td>
                            <td><span class="text-danger">{{ s.candidatsExpiresNonSoldes }}</span></td>
                          }
                          @if (activeSiteModal === 'financier') {
                            <td><strong class="text-success">{{ s.montantEncaisse | number }} FCFA</strong></td>
                            <td><strong class="text-danger">{{ s.montantRestant | number }} FCFA</strong></td>
                          }
                          @if (activeSiteModal === 'caisse') {
                            <td class="text-success">+ {{ s.totalEntreesCaisse | number }} FCFA</td>
                            <td class="text-danger">- {{ s.totalSortiesCaisse | number }} FCFA</td>
                            <td>
                              <strong [ngClass]="s.soldeCaisse >= 0 ? 'text-success' : 'text-danger'">
                                {{ s.soldeCaisse | number }} FCFA
                              </strong>
                            </td>
                          }
                          @if (activeSiteModal === 'examens') {
                            <td><span class="badge badge-reussi">{{ s.examensReussis }}</span></td>
                            <td><span class="badge badge-ajourne">{{ s.examensEchecs }}</span></td>
                            <td><span class="badge badge-programme">{{ s.examensProgrammes }}</span></td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeSiteModal()">Fermer</button>
            </div>
          </div>
        </div>
      }
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .dashboard-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .dashboard-title {
      color: var(--primary);
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.2rem;
    }

    .dashboard-subtitle {
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 500;
    }

    .role-badge {
      background: #fef3c7;
      color: #b45309;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 0.75rem;
      border: 1px solid #fde68a;
    }

    .refresh-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      flex-shrink: 0;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: #ffffff;
      color: var(--primary);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-fast);
    }

    .refresh-btn:hover:not(:disabled) {
      background: #f8fafc;
      color: #d97706;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .refresh-btn:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .refresh-btn.spinning svg {
      animation: refresh-spin 0.8s linear infinite;
    }

    @keyframes refresh-spin {
      to { transform: rotate(360deg); }
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

    .stat-card {
      position: relative;
    }

    .stat-action-btn {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      width: 1.8rem;
      height: 1.8rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text-dark, #334155);
      cursor: pointer;
      opacity: 0.85;
      transition: all var(--transition-fast);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      z-index: 2;
    }

    .stat-card:hover .stat-action-btn {
      opacity: 1;
    }

    .stat-action-btn:hover {
      background: #ffffff;
      color: var(--primary);
      transform: scale(1.08);
      border-color: var(--primary);
    }

    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
      font-weight: 500;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .dashboard-grid > .card {
      min-width: 0;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-content {
      background: var(--surface, #ffffff);
      border-radius: var(--radius-lg, 12px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color, #e2e8f0);
      animation: modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-content.modal-lg {
      max-width: 780px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .modal-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-dark, #0f172a);
    }

    .modal-body {
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background: var(--surface-secondary, #f8fafc);
      border-bottom-left-radius: var(--radius-lg, 12px);
      border-bottom-right-radius: var(--radius-lg, 12px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  currentUser: any = null;
  loadingStats = false;

  activeSiteModal: 'candidats' | 'financier' | 'caisse' | 'examens' | null = null;

  get modalTitle(): string {
    switch (this.activeSiteModal) {
      case 'candidats': return 'Total Candidats';
      case 'financier': return 'Total Encaissé & Reste Dû';
      case 'caisse': return 'Solde de Caisse';
      case 'examens': return 'Examens Pédagogiques';
      default: return '';
    }
  }

  openSiteModal(type: 'candidats' | 'financier' | 'caisse' | 'examens'): void {
    this.activeSiteModal = type;
  }

  closeSiteModal(): void {
    this.activeSiteModal = null;
  }

  private readonly statDefs: { id: string; roles: string[] }[] = [
    { id: 'candidats', roles: [] },
    { id: 'financier', roles: ['ADMIN', 'CAISSIERE', 'SECRETAIRE'] },
    { id: 'caisse', roles: ['ADMIN', 'CAISSIERE'] },
    { id: 'examens', roles: [] }
  ];

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

  isStatVisible(id: string): boolean {
    const def = this.statDefs.find(d => d.id === id);
    if (!def) return false;
    return def.roles.length === 0 || this.hasRole(def.roles);
  }
}
