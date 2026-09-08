import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { HistoriqueAction } from '../../core/models/models';

@Component({
    selector: 'app-audit',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="audit-page">
      <div class="page-header-bar">
        <div>
          <h2>Journal d'Audit & Traçabilité (RG10)</h2>
          <p>Historique inaltérable de toutes les opérations sensibles réalisées sur la plateforme</p>
        </div>
      </div>
    
      <div class="card filter-card">
        <div class="filter-grid">
          <div>
            <select class="form-control" [(ngModel)]="entiteFiltre" (change)="loadAudit()">
              <option value="">Toutes les entités</option>
              <option value="Candidat">Candidats</option>
              <option value="Paiement">Paiements / Reçus</option>
              <option value="PassageExamen">Examens</option>
              <option value="TransactionCaisse">Caisse</option>
              <option value="Utilisateur">Comptes Utilisateurs</option>
            </select>
          </div>
          <div>
            <input type="text" class="form-control" placeholder="Filtrer par action..." [(ngModel)]="actionFiltre" (keyup.enter)="loadAudit()" />
          </div>
          <div>
            <button class="btn btn-secondary" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
      </div>
    
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Opérateur</th>
                <th>Action</th>
                <th>Entité Cible</th>
                <th>Identifiant</th>
                <th>Détails de l'opération</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="7" class="text-center py-4">Chargement du journal d'audit...</td>
                </tr>
              }
              @if (!loading && logs.length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-4">Aucune trace enregistrée.</td>
                </tr>
              }
              @for (l of logs; track l) {
                <tr>
                  <td>{{ l.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td><strong>{{ l.utilisateurNomComplet }}</strong></td>
                  <td><span class="action-tag">{{ l.action }}</span></td>
                  <td><span class="badge badge-programme">{{ l.entiteCible }}</span></td>
                  <td><code>{{ l.identifiantCible || '—' }}</code></td>
                  <td><small>{{ l.details }}</small></td>
                  <td>
                    @if (l.motif) {
                      <span class="motif-tag">💬 {{ l.motif }}</span>
                    }
                    @if (!l.motif) {
                      <span class="text-muted">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
    
        @if (totalPages > 1) {
          <div class="pagination-bar">
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="changePage(page - 1)">◀ Précédent</button>
            <span>Page {{ page + 1 }} sur {{ totalPages }} ({{ totalElements }} entrées d'audit)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">Suivant ▶</button>
          </div>
        }
      </div>
    </div>
    `,
    styles: [`
    .page-header-bar {
      margin-bottom: 1.5rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1.5fr 1.5fr 0.5fr;
      gap: 1rem;
    }

    .action-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .motif-tag {
      background: #fef3c7;
      color: #92400e;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  `]
})
export class AuditComponent implements OnInit {
  logs: HistoriqueAction[] = [];
  loading = false;

  entiteFiltre = '';
  actionFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAudit();
  }

  loadAudit(): void {
    this.loading = true;
    this.apiService.getAuditLogs(this.entiteFiltre, this.actionFiltre, this.page).subscribe({
      next: (res) => {
        this.logs = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  changePage(p: number): void {
    this.page = p;
    this.loadAudit();
  }

  resetFiltres(): void {
    this.entiteFiltre = '';
    this.actionFiltre = '';
    this.page = 0;
    this.loadAudit();
  }
}
