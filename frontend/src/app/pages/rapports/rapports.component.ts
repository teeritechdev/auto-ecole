import { Component, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-rapports',
    imports: [FormsModule],
    template: `
    <div class="rapports-page">
      <div class="page-header-bar">
        <div>
          <h2>Centre de Rapports & Exports Officiels</h2>
          <p>Générez et téléchargez les listes et relevés en formats PDF et Excel</p>
        </div>
      </div>

      <div class="reports-grid">
        <!-- 1. Liste des Candidats -->
        <div class="card report-card">
          <div class="report-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="report-body">
            <h3>Liste Globale des Candidats</h3>
            <p>Exportation complète du registre des candidats avec catégories, montants, total versé, soldes restants et statuts administratifs.</p>
            <div class="report-buttons">
              <button class="btn btn-primary btn-sm" (click)="telechargerCandidatsPdf()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Télécharger PDF
              </button>
              <button class="btn btn-outline btn-sm" (click)="imprimerCandidats()" title="Imprimer directement">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer
              </button>
              <button class="btn btn-success btn-sm" (click)="telechargerCandidatsExcel()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Télécharger Excel
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Journal de Caisse -->
        <div class="card report-card">
          <div class="report-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 21 8 3 8"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/></svg>
          </div>
          <div class="report-body">
            <h3>Journal des Mouvements de Caisse</h3>
            <p>Relevé périodique des flux financiers (recettes, encaissements de formation, charges d'exploitation, salaires, carburant). Laissez les dates vides pour un export complet, ou précisez une période (ex: export comptable mensuel).</p>
            <div class="periode-row">
              <div class="form-group">
                <label class="form-label">Du</label>
                <input type="date" class="form-control" [(ngModel)]="caisseDebut" name="caisseDebut" />
              </div>
              <div class="form-group">
                <label class="form-label">Au</label>
                <input type="date" class="form-control" [(ngModel)]="caisseFin" name="caisseFin" />
              </div>
            </div>
            <div class="report-buttons">
              <button class="btn btn-primary btn-sm" (click)="telechargerCaissePdf()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Relevé Caisse PDF
              </button>
              <button class="btn btn-outline btn-sm" (click)="imprimerCaisse()" title="Imprimer directement">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer
              </button>
              <button class="btn btn-success btn-sm" (click)="telechargerCaisseExcel()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Livre Caisse Excel
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Reçu ou Relevé Individuel -->
        <div class="card report-card">
          <div class="report-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
          </div>
          <div class="report-body">
            <h3>Relevé de Compte Individuel Candidat</h3>
            <p>Génération de la fiche récapitulative financière individuelle d'un candidat avec détail de chaque versement et reste à payer.</p>
            <div class="report-buttons">
              <span class="badge badge-solde">Accessible depuis la fiche candidat 360°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .page-header-bar {
      margin-bottom: 1.5rem;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .reports-grid > .card {
      /* Un item de grille refuse par défaut de rétrécir sous la largeur intrinsèque de
         son contenu : sans ça, la colonne "1fr" déborde quand même sur petit téléphone. */
      min-width: 0;
    }

    .report-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.75rem;
    }

    .report-icon {
      font-size: 2.5rem;
    }

    .report-body h3 {
      font-size: 1.15rem;
      margin-bottom: 0.5rem;
    }

    .report-body p {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }

    .report-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .periode-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .periode-row .form-group {
      flex: 1;
      min-width: 140px;
    }
  `]
})
export class RapportsComponent {
  caisseDebut = '';
  caisseFin = '';

  constructor(private apiService: ApiService) {}

  telechargerCandidatsPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsPdfUrl(), 'candidats_auto_ecole.pdf');
  }

  telechargerCandidatsExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsExcelUrl(), 'candidats_auto_ecole.xlsx');
  }

  imprimerCandidats(): void {
    this.apiService.printBlob(this.apiService.getCandidatsPdfUrl());
  }

  telechargerCaissePdf(): void {
    const [debut, fin] = this.buildPeriode();
    this.apiService.downloadBlob(this.apiService.getCaissePdfUrl(debut, fin), 'journal_caisse.pdf');
  }

  telechargerCaisseExcel(): void {
    const [debut, fin] = this.buildPeriode();
    this.apiService.downloadBlob(this.apiService.getCaisseExcelUrl(debut, fin), 'journal_caisse.xlsx');
  }

  imprimerCaisse(): void {
    const [debut, fin] = this.buildPeriode();
    this.apiService.printBlob(this.apiService.getCaissePdfUrl(debut, fin));
  }

  private buildPeriode(): [string | undefined, string | undefined] {
    const debut = this.caisseDebut ? `${this.caisseDebut}T00:00:00` : undefined;
    const fin = this.caisseFin ? `${this.caisseFin}T23:59:59` : undefined;
    return [debut, fin];
  }
}
