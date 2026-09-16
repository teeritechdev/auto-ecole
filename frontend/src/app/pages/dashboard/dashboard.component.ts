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
    
      <!-- STATISTIQUES MASQUÉES : REMISE EN PLACE -->
      @if (statsCachees.length > 0) {
        <div class="hidden-stats-bar">
          <span class="hidden-stats-label">Statistiques masquées :</span>
          @for (h of statsCachees; track h.id) {
            <button type="button" class="chip-add" (click)="showStat(h.id)" title="Remettre cette statistique">+ {{ h.label }}</button>
          }
        </div>
      }

      <!-- KPI STATS CARDS -->
      <div class="stats-grid">
        <!-- 1. Total Candidats -->
        @if (isStatVisible('candidats')) {
          <div class="stat-card primary">
            <button type="button" class="stat-remove-btn" (click)="hideStat('candidats')" title="Masquer cette statistique">✕</button>
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
        }

        <!-- 2. Montant Total Encaissé -->
        @if (isStatVisible('financier')) {
          <div class="stat-card success">
            <button type="button" class="stat-remove-btn" (click)="hideStat('financier')" title="Masquer cette statistique">✕</button>
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
        @if (isStatVisible('caisse')) {
          <div class="stat-card info">
            <button type="button" class="stat-remove-btn" (click)="hideStat('caisse')" title="Masquer cette statistique">✕</button>
            <div class="stat-icon info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
            </div>
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
            <button type="button" class="stat-remove-btn" (click)="hideStat('examens')" title="Masquer cette statistique">✕</button>
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
                      <th>Date</th>
                      <th>Libellé</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of stats!.dernieresTransactionsCaisse; track t) {
                      <tr>
                        <td>{{ t.dateTransaction | date:'dd/MM/yyyy' }}</td>
                        <td>{{ t.libelle }}</td>
                        <td>
                          <span class="badge" [ngClass]="t.typeMouvement === 'ENTREE' ? 'badge-solde' : 'badge-expire'">
                            {{ t.typeMouvement === 'ENTREE' ? 'Entrée' : 'Sortie' }}
                          </span>
                        </td>
                        <td>
                          <strong [ngClass]="t.typeMouvement === 'ENTREE' ? 'text-success' : 'text-danger'">
                            {{ t.montant | number }} FCFA
                          </strong>
                        </td>
                        <td>{{ t.utilisateurNomComplet }}</td>
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

    .refresh-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      flex-shrink: 0;
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      cursor: pointer;
      transition: background var(--transition-fast), transform var(--transition-fast);
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.24);
      transform: translateY(-1px);
    }

    .refresh-btn:disabled {
      cursor: not-allowed;
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

    .stat-remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 1.5rem;
      height: 1.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      line-height: 1;
      opacity: 0;
      transition: opacity var(--transition-fast), background var(--transition-fast);
    }

    .stat-card:hover .stat-remove-btn {
      opacity: 1;
    }

    .stat-remove-btn:hover {
      background: rgba(0, 0, 0, 0.08);
      color: var(--text-main);
    }

    .hidden-stats-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .hidden-stats-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .chip-add {
      border: 1px dashed var(--border-color);
      background: transparent;
      border-radius: var(--radius-full);
      padding: 0.25rem 0.75rem;
      font-size: 0.78rem;
      color: var(--primary);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .chip-add:hover {
      background: rgba(37, 99, 235, 0.08);
    }

    .dashboard-grid {
      display: grid;
      /* 450px de minimum dépassait la largeur de nombreux téléphones (l'override global
         @media qui force 1fr sur cette classe n'est pas fiable ici) : on descend le seuil
         sous la largeur des petits téléphones plutôt que de dépendre de cet override. */
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .dashboard-grid > .card {
      /* Comme pour un flex item, un item de grille refuse par défaut de rétrécir sous la
         largeur intrinsèque de son contenu (ici le card-header) : sans ça, la colonne
         "1fr" s'élargit quand même au-delà de l'écran sur petit téléphone. */
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
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  currentUser: any = null;
  loadingStats = false;

  /** Cartes de statistiques du tableau de bord : chacune peut être masquée par
   *  l'utilisateur (bouton ✕) puis remise en place (chip "+"), préférence gardée
   *  par navigateur via localStorage — un moniteur et une caissière n'ont pas
   *  forcément les mêmes cartes utiles au quotidien. */
  private readonly statDefs: { id: string; label: string; roles: string[] }[] = [
    { id: 'candidats', label: 'Total Candidats', roles: [] },
    { id: 'financier', label: 'Total Encaissé', roles: ['ADMIN', 'CAISSIERE', 'SECRETAIRE'] },
    { id: 'caisse', label: 'Solde de Caisse', roles: ['ADMIN', 'CAISSIERE'] },
    { id: 'examens', label: 'Examens Pédagogiques', roles: [] }
  ];
  private readonly HIDDEN_STATS_KEY = 'dashboard_hidden_stats';
  private hiddenStats = new Set<string>();

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.chargerStatsCachees();
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
    if (def.roles.length > 0 && !this.hasRole(def.roles)) return false;
    return !this.hiddenStats.has(id);
  }

  get statsCachees(): { id: string; label: string }[] {
    return this.statDefs.filter(d => this.hiddenStats.has(d.id) && (d.roles.length === 0 || this.hasRole(d.roles)));
  }

  hideStat(id: string): void {
    this.hiddenStats.add(id);
    this.sauvegarderStatsCachees();
  }

  showStat(id: string): void {
    this.hiddenStats.delete(id);
    this.sauvegarderStatsCachees();
  }

  private chargerStatsCachees(): void {
    try {
      const raw = localStorage.getItem(this.HIDDEN_STATS_KEY);
      this.hiddenStats = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      this.hiddenStats = new Set();
    }
  }

  private sauvegarderStatsCachees(): void {
    try {
      localStorage.setItem(this.HIDDEN_STATS_KEY, JSON.stringify(Array.from(this.hiddenStats)));
    } catch {
      // Stockage indisponible (navigation privée, etc.) : la préférence ne sera
      // simplement pas conservée d'une session à l'autre.
    }
  }
}
