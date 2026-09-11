import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { HistoriqueAction, UtilisateurDTO } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

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
        @if (selectedIds.size > 0) {
          <button class="btn btn-danger" (click)="openDeleteModal(selectedIdsArray)">
            🗑️ Supprimer la sélection ({{ selectedIds.size }})
          </button>
        }
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
              <option value="HistoriqueAction">Journal d'Audit (suppressions)</option>
            </select>
          </div>
          <div>
            <input type="text" class="form-control" placeholder="Filtrer par action..." [(ngModel)]="actionFiltre" (keyup.enter)="loadAudit()" />
          </div>
          <div>
            <select class="form-control" [(ngModel)]="utilisateurFiltre" (change)="loadAudit()">
              <option value="">Tous les opérateurs</option>
              @for (u of utilisateurs; track u) {
                <option [value]="u.id">{{ u.nom }} {{ u.prenom }}</option>
              }
            </select>
          </div>
          <div>
            <button class="btn btn-secondary" (click)="resetFiltres()">Réinitialiser</button>
          </div>
        </div>
        <div class="filter-grid periode-grid">
          <div>
            <label class="form-label">Du</label>
            <input type="date" class="form-control" [(ngModel)]="debutFiltre" (change)="loadAudit()" />
          </div>
          <div>
            <label class="form-label">Au</label>
            <input type="date" class="form-control" [(ngModel)]="finFiltre" (change)="loadAudit()" />
          </div>
        </div>
      </div>
    
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input type="checkbox" [checked]="allOnPageSelected" (change)="toggleSelectAll()" />
                </th>
                <th>Date & Heure</th>
                <th>Opérateur</th>
                <th>Action</th>
                <th>Entité Cible</th>
                <th>Identifiant</th>
                <th>Détails de l'opération</th>
                <th>Motif</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center py-4">Chargement du journal d'audit...</td>
                </tr>
              }
              @if (!loading && logs.length === 0) {
                <tr>
                  <td colspan="9" class="text-center py-4">Aucune trace enregistrée.</td>
                </tr>
              }
              @for (l of logs; track l) {
                <tr>
                  <td class="checkbox-col">
                    <input type="checkbox" [checked]="selectedIds.has(l.id)" (change)="toggleSelection(l.id)" />
                  </td>
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
                  <td class="text-right">
                    <button class="btn btn-danger btn-sm" (click)="openDeleteModal([l.id])" title="Supprimer">🗑️</button>
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

      <!-- MODAL SUPPRESSION -->
      @if (showDeleteModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>⚠️ Confirmation de Suppression</h3>
              <button class="btn btn-outline btn-sm" (click)="showDeleteModal = false">✕</button>
            </div>
            <div class="modal-body">
              @if (deleteError) {
                <div class="alert alert-danger">⚠️ {{ deleteError }}</div>
              }
              <p>Es-tu sûr de vouloir supprimer définitivement <strong>{{ idsToDelete.length }}</strong> entrée(s) du journal d'audit ? Cette action reste elle-même journalisée.</p>
              <div class="form-group mt-3">
                <label class="form-label">Motif de suppression (obligatoire) <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="deleteMotif" placeholder="Ex: Nettoyage des données de test" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteModal = false">Annuler</button>
              <button type="button" class="btn btn-danger" [disabled]="!deleteMotif || deleting" (click)="confirmDelete()">
                {{ deleting ? 'Suppression...' : 'Confirmer la Suppression' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .page-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1.3fr 1.3fr 1.3fr 0.5fr;
      gap: 1rem;
    }

    .periode-grid {
      grid-template-columns: repeat(2, minmax(180px, 1fr));
      margin-top: 1rem;
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

    .checkbox-col {
      width: 2.5rem;
      text-align: center;
    }

    .text-right { text-align: right; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class AuditComponent implements OnInit {
  logs: HistoriqueAction[] = [];
  utilisateurs: UtilisateurDTO[] = [];
  loading = false;

  entiteFiltre = '';
  actionFiltre = '';
  utilisateurFiltre = '';
  debutFiltre = '';
  finFiltre = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;

  selectedIds = new Set<number>();

  showDeleteModal = false;
  idsToDelete: number[] = [];
  deleteMotif = '';
  deleteError = '';
  deleting = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAudit();
    this.apiService.getUtilisateurs().subscribe({ next: (res) => this.utilisateurs = res });
  }

  get selectedIdsArray(): number[] {
    return Array.from(this.selectedIds);
  }

  get allOnPageSelected(): boolean {
    return this.logs.length > 0 && this.logs.every(l => this.selectedIds.has(l.id));
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(): void {
    if (this.allOnPageSelected) {
      this.logs.forEach(l => this.selectedIds.delete(l.id));
    } else {
      this.logs.forEach(l => this.selectedIds.add(l.id));
    }
  }

  openDeleteModal(ids: number[]): void {
    this.idsToDelete = ids;
    this.deleteMotif = '';
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deleteMotif) return;
    this.deleting = true;
    this.deleteError = '';

    const onSuccess = () => {
      this.deleting = false;
      this.showDeleteModal = false;
      this.idsToDelete.forEach(id => this.selectedIds.delete(id));
      this.loadAudit();
    };
    const onError = (err: any) => {
      this.deleting = false;
      this.deleteError = extraireMessageErreur(err, 'Erreur lors de la suppression.');
    };

    if (this.idsToDelete.length === 1) {
      this.apiService.deleteAuditLog(this.idsToDelete[0], this.deleteMotif).subscribe({ next: onSuccess, error: onError });
    } else {
      this.apiService.deleteAuditLogs(this.idsToDelete, this.deleteMotif).subscribe({ next: onSuccess, error: onError });
    }
  }

  loadAudit(): void {
    this.loading = true;
    const debut = this.debutFiltre ? `${this.debutFiltre}T00:00:00` : undefined;
    const fin = this.finFiltre ? `${this.finFiltre}T23:59:59` : undefined;
    const utilisateurId = this.utilisateurFiltre ? Number(this.utilisateurFiltre) : undefined;
    this.apiService.getAuditLogs(this.entiteFiltre, this.actionFiltre, this.page, 20, debut, fin, utilisateurId).subscribe({
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
    this.utilisateurFiltre = '';
    this.debutFiltre = '';
    this.finFiltre = '';
    this.page = 0;
    this.loadAudit();
  }
}
