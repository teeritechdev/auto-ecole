import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <div class="report-icon">👥</div>
          <div class="report-body">
            <h3>Liste Globale des Candidats</h3>
            <p>Exportation complète du registre des candidats avec forfaits, montants, total versé, soldes restants et statuts administratifs.</p>
            <div class="report-buttons">
              <button class="btn btn-primary btn-sm" (click)="telechargerCandidatsPdf()">📄 Télécharger PDF</button>
              <button class="btn btn-success btn-sm" (click)="telechargerCandidatsExcel()">📊 Télécharger Excel</button>
            </div>
          </div>
        </div>

        <!-- 2. Journal de Caisse -->
        <div class="card report-card">
          <div class="report-icon">🏦</div>
          <div class="report-body">
            <h3>Journal des Mouvements de Caisse</h3>
            <p>Relevé périodique des flux financiers (recettes, encaissements de formation, charges d'exploitation, salaires, carburant).</p>
            <div class="report-buttons">
              <button class="btn btn-primary btn-sm" (click)="telechargerCaissePdf()">📄 Relevé Caisse PDF</button>
              <button class="btn btn-success btn-sm" (click)="telechargerCaisseExcel()">📊 Livre Caisse Excel</button>
            </div>
          </div>
        </div>

        <!-- 3. Reçu ou Relevé Individuel -->
        <div class="card report-card">
          <div class="report-icon">📑</div>
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
  styles: [`
    .page-header-bar {
      margin-bottom: 1.5rem;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
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
  `]
})
export class RapportsComponent {
  constructor(private apiService: ApiService) {}

  telechargerCandidatsPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsPdfUrl(), 'candidats_auto_ecole.pdf');
  }

  telechargerCandidatsExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCandidatsExcelUrl(), 'candidats_auto_ecole.xlsx');
  }

  telechargerCaissePdf(): void {
    this.apiService.downloadBlob(this.apiService.getCaissePdfUrl(), 'journal_caisse.pdf');
  }

  telechargerCaisseExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCaisseExcelUrl(), 'journal_caisse.xlsx');
  }
}
