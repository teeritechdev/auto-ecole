import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CorrectionReponse, EtatTentative, LettreReponse, TentativeEnCours } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

@Component({
  selector: 'app-code-quiz',
  imports: [CommonModule, RouterModule],
  template: `
    @if (loading) {
      <div class="card">Chargement de la tentative...</div>
    }

    @if (error) {
      <div class="alert alert-danger">{{ error }}</div>
    }

    @if (enCours) {
      <div class="quiz-card">
        <div class="quiz-header">
          <span>Cycle {{ enCours.numeroCycle }} — Question {{ enCours.indexQuestionCourante + 1 }} / {{ enCours.totalQuestionsDuCycle }}</span>
          <span class="chrono" [class.chrono-warning]="tempsRestantQuestion <= 5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ tempsRestantQuestion }}s
          </span>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressionPct"></div>
        </div>

        @if (enCours.question.imageData) {
          <div class="question-image">
            <img [src]="enCours.question.imageData" alt="Illustration de la question" />
          </div>
        }

        <p class="question-enonce">{{ enCours.question.enonce }}</p>

        <div class="options">
          <button type="button" class="option"
            [class.selected]="reponseSelectionnee === 'A' && !verrouille"
            [class.correct]="verrouille && derniereCorrection?.bonneReponse === 'A'"
            [class.incorrect]="verrouille && reponseSelectionnee === 'A' && !derniereCorrection?.correcte"
            [disabled]="verrouille || envoi"
            (click)="selectionner('A')">
            <span>A. {{ enCours.question.reponseA }}</span>
          </button>
          <button type="button" class="option"
            [class.selected]="reponseSelectionnee === 'B' && !verrouille"
            [class.correct]="verrouille && derniereCorrection?.bonneReponse === 'B'"
            [class.incorrect]="verrouille && reponseSelectionnee === 'B' && !derniereCorrection?.correcte"
            [disabled]="verrouille || envoi"
            (click)="selectionner('B')">
            <span>B. {{ enCours.question.reponseB }}</span>
          </button>
          @if (enCours.question.reponseC) {
            <button type="button" class="option"
              [class.selected]="reponseSelectionnee === 'C' && !verrouille"
              [class.correct]="verrouille && derniereCorrection?.bonneReponse === 'C'"
              [class.incorrect]="verrouille && reponseSelectionnee === 'C' && !derniereCorrection?.correcte"
              [disabled]="verrouille || envoi"
              (click)="selectionner('C')">
              <span>C. {{ enCours.question.reponseC }}</span>
            </button>
          }
          @if (enCours.question.reponseD) {
            <button type="button" class="option"
              [class.selected]="reponseSelectionnee === 'D' && !verrouille"
              [class.correct]="verrouille && derniereCorrection?.bonneReponse === 'D'"
              [class.incorrect]="verrouille && reponseSelectionnee === 'D' && !derniereCorrection?.correcte"
              [disabled]="verrouille || envoi"
              (click)="selectionner('D')">
              <span>D. {{ enCours.question.reponseD }}</span>
            </button>
          }
        </div>

        @if (verrouille && derniereCorrection) {
          <div class="correction-panel" [class.correction-ok]="derniereCorrection.correcte" [class.correction-ko]="!derniereCorrection.correcte">
            <div class="correction-header">
              @if (derniereCorrection.correcte) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
              {{ derniereCorrection.correcte ? 'Bonne réponse' : 'Réponse incorrecte' }}
            </div>
            @if (derniereCorrection.explication) {
              <p class="correction-explication">{{ derniereCorrection.explication }}</p>
            }
          </div>
        }

        <div class="quiz-actions">
          <button
            type="button"
            class="btn btn-secondary"
            [disabled]="!enCours.peutRevenirEnArriere || envoi || verrouille"
            (click)="precedente()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Précédent
          </button>
          @if (verrouille) {
            <button type="button" class="btn btn-primary" (click)="continuer()">
              {{ estDerniereQuestion ? 'Voir le résultat' : 'Suivant' }}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          }
        </div>
      </div>
    }

    @if (resultat) {
      <div class="quiz-card resultat-card">
        <h2>Résultat du Cycle {{ resultat.numeroCycle }}</h2>
        <div class="score">{{ resultat.score }} / {{ resultat.totalQuestions }}</div>
        <p>Seuil de réussite : {{ resultat.seuilReussite }} / {{ resultat.totalQuestions }}</p>
        @if (resultat.statut === 'REUSSI') {
          <div class="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Cycle réussi ! Le Cycle suivant est débloqué.
          </div>
        }
        @if (resultat.statut === 'EXPIREE') {
          <div class="alert alert-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Le temps imparti pour ce Cycle est écoulé.
          </div>
        }
        @if (resultat.statut === 'ECHEC') {
          <div class="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Cycle non réussi. {{ resultat.peutReprendre ? 'Il faut reprendre ce Cycle.' : '' }}
          </div>
          @if (resultat.peutReprendre) {
            <button class="btn btn-warning" (click)="reprendreCycle()" [disabled]="loading" style="margin-bottom: 1rem; margin-right: 1rem;">
              Reprendre le Cycle
            </button>
          }
        }
        <a routerLink="/espace-candidat" class="btn btn-primary" style="margin-bottom: 1rem;">Retour à ma progression</a>
      </div>
    }
  `,
  styles: [`
    .quiz-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: 1.5rem;
      max-width: 620px;
      margin: 0 auto;
    }
    .quiz-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 0.75rem; }
    .chrono { display:inline-flex; align-items:center; gap:0.3rem; color: var(--primary); }
    .chrono-warning { color: var(--danger); font-weight: 700; }
    .progress-bar { height: 6px; border-radius: 3px; background: var(--border-color); overflow: hidden; margin-bottom: 1.25rem; }
    .progress-fill { height: 100%; background: var(--primary); transition: width 0.2s; }
    .question-image { margin-bottom: 1rem; text-align: center; }
    .question-image img { max-width: 100%; max-height: 260px; border-radius: var(--radius-md); }
    .question-enonce { font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem; }
    .options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
    .option {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s;
      background: var(--bg-card);
      font: inherit;
      text-align: left;
      width: 100%;
    }
    .option:hover:not(:disabled) { border-color: var(--primary); }
    .option.selected { border-color: var(--primary); background: var(--primary-light); }
    .option.correct { border-color: var(--success); background: var(--success-light); font-weight: 600; }
    .option.incorrect { border-color: var(--danger); background: var(--danger-light); font-weight: 600; }
    .option:disabled { cursor: default; }
    .option:disabled:not(.correct):not(.incorrect) { opacity: 0.6; }
    .quiz-actions { display: flex; justify-content: space-between; gap: 0.75rem; }
    .resultat-card { text-align: center; }
    .score { font-size: 2.5rem; font-weight: 800; color: var(--primary); margin: 0.75rem 0; }
    .correction-panel {
      margin-bottom: 1.25rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-color);
    }
    .correction-ok { background: var(--success-light); border-color: var(--success); }
    .correction-ko { background: var(--danger-light); border-color: var(--danger); }
    .correction-header { display:flex; align-items:center; gap:0.4rem; font-weight: 700; }
    .correction-explication { margin-top: 0.35rem; font-size: 0.9rem; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class CodeQuizComponent implements OnInit, OnDestroy {
  enCours: TentativeEnCours | null = null;
  resultat: EtatTentative['resultat'] | null = null;
  derniereCorrection: CorrectionReponse | null = null;
  reponseSelectionnee: LettreReponse | null = null;
  /** true une fois qu'une réponse a été soumise et que sa correction est affichée
   *  en place, en attendant que le candidat clique sur "Suivant" pour avancer. */
  verrouille = false;
  loading = false;
  envoi = false;
  error = '';

  tempsRestantQuestion = 0;
  private minuteur: ReturnType<typeof setInterval> | null = null;
  private tentativeId!: number;
  /** État renvoyé par le backend (question suivante ou résultat), retenu tant que la
   *  correction de la question qui vient d'être répondue est affichée à l'écran. */
  private etatEnAttente: EtatTentative | null = null;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.tentativeId = Number(this.route.snapshot.paramMap.get('tentativeId'));
    this.charger();
  }

  ngOnDestroy(): void {
    this.arreterMinuteur();
  }

  get estDerniereQuestion(): boolean {
    return !!this.enCours && this.enCours.indexQuestionCourante === this.enCours.totalQuestionsDuCycle - 1;
  }

  get progressionPct(): number {
    if (!this.enCours) return 0;
    return (this.enCours.indexQuestionCourante / this.enCours.totalQuestionsDuCycle) * 100;
  }

  private charger(): void {
    this.loading = true;
    this.apiService.getEtatTentativeCode(this.tentativeId).subscribe({
      next: (etat) => { this.loading = false; this.appliquerEtat(etat); },
      error: (err) => { this.loading = false; this.error = extraireMessageErreur(err, 'Impossible de charger la tentative.'); }
    });
  }

  private appliquerEtat(etat: EtatTentative): void {
    this.arreterMinuteur();
    this.reponseSelectionnee = null;
    this.derniereCorrection = null;
    this.etatEnAttente = null;
    this.verrouille = false;
    if (etat.resultat) {
      this.enCours = null;
      this.resultat = etat.resultat;
      return;
    }
    this.enCours = etat.enCours ?? null;
    this.resultat = null;
    if (this.enCours) {
      this.demarrerMinuteur(this.enCours);
    }
  }

  private demarrerMinuteur(enCours: TentativeEnCours): void {
    const debutQuestion = new Date(enCours.dateAffichageQuestionCourante).getTime();
    const calculerRestant = () => Math.max(0, enCours.tempsParQuestionSecondes - Math.floor((Date.now() - debutQuestion) / 1000));
    this.tempsRestantQuestion = calculerRestant();

    this.minuteur = setInterval(() => {
      this.tempsRestantQuestion = calculerRestant();
      if (this.tempsRestantQuestion <= 0) {
        this.arreterMinuteur();
        this.soumettre();
      }
    }, 1000);
  }

  private arreterMinuteur(): void {
    if (this.minuteur) {
      clearInterval(this.minuteur);
      this.minuteur = null;
    }
  }

  /** Sélectionner une réponse soumet immédiatement — pas de confirmation supplémentaire. */
  selectionner(lettre: LettreReponse): void {
    if (this.envoi || this.verrouille || !this.enCours) return;
    this.reponseSelectionnee = lettre;
    this.soumettre();
  }

  private soumettre(): void {
    if (this.envoi || !this.enCours) return;
    this.envoi = true;
    this.arreterMinuteur();
    this.apiService.repondreTentativeCode(this.tentativeId, this.reponseSelectionnee).subscribe({
      next: (etat) => {
        this.envoi = false;
        // Le backend a déjà avancé à la question suivante (ou clos la tentative) ; si une
        // correction est renvoyée (correction immédiate active pour cette tentative), on la
        // montre sur la question qui vient d'être répondue avant d'appliquer cet état.
        if (etat.correction) {
          this.derniereCorrection = etat.correction;
          this.etatEnAttente = etat;
          this.verrouille = true;
        } else {
          this.appliquerEtat(etat);
        }
      },
      error: (err) => { this.envoi = false; this.error = extraireMessageErreur(err, "Impossible d'enregistrer la réponse."); }
    });
  }

  continuer(): void {
    if (!this.etatEnAttente) return;
    const etat = this.etatEnAttente;
    this.appliquerEtat(etat);
  }

  precedente(): void {
    if (this.envoi || this.verrouille) return;
    this.envoi = true;
    this.apiService.revenirQuestionPrecedenteCode(this.tentativeId).subscribe({
      next: (etat) => { this.envoi = false; this.appliquerEtat(etat); },
      error: (err) => { this.envoi = false; this.error = extraireMessageErreur(err, 'Impossible de revenir en arrière.'); }
    });
  }

  reprendreCycle(): void {
    if (!this.resultat || !this.resultat.peutReprendre || this.loading) return;
    this.loading = true;
    this.error = '';
    this.apiService.demarrerCycleCode(this.resultat.numeroCycle).subscribe({
      next: (etat) => {
        this.loading = false;
        if (etat.enCours) {
          this.tentativeId = etat.enCours.tentativeId;
          this.router.navigate(['/espace-candidat/code', this.tentativeId], { replaceUrl: true });
          this.appliquerEtat(etat);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = extraireMessageErreur(err, 'Impossible de reprendre le Cycle.');
      }
    });
  }
}
