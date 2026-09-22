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
      <div class="alert alert-danger" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <span>{{ error }}</span>
        <a routerLink="/espace-candidat" class="btn btn-outline btn-sm">Retour à l'espace candidat</a>
      </div>
    }

    @if (enCours) {
      <div class="quiz-card">
        <div class="quiz-topbar">
          <span class="serie-titre">Série {{ enCours.serieNom }}</span>
          <span class="chrono" [class.chrono-warning]="tempsRestantQuestion <= 5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ tempsRestantQuestion }}s
          </span>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressionPct"></div>
        </div>

        <p class="question-compteur">Question : {{ enCours.indexQuestionCourante + 1 }}/{{ enCours.totalQuestionsDeLaSerie }}</p>

        <div class="question-layout">
          @if (enCours.question.imageData) {
            <div class="question-image">
              <img [src]="enCours.question.imageData" alt="Illustration de la question" />
            </div>
          }

          <div class="question-body">
            <p class="question-enonce">{{ enCours.question.enonce }}</p>

            @if (enCours.question.sousTitreGroupeAB) {
              <p class="groupe-titre">{{ enCours.question.sousTitreGroupeAB }}</p>
            }
            <div class="options">
              @for (lettre of lettresGroupe1; track lettre) {
                <button type="button" class="option"
                  [class.selected]="estSelectionnee(lettre) && !verrouille"
                  [class.correct]="verrouille && estBonneReponse(lettre)"
                  [class.incorrect]="verrouille && estSelectionnee(lettre) && !estBonneReponse(lettre)"
                  [disabled]="verrouille || envoi"
                  (click)="toggleReponse(lettre)">
                  <span class="option-check" [class.checked]="estSelectionnee(lettre)"></span>
                  <span class="option-texte">{{ texteReponse(lettre) || (lettre === 'A' ? 'OUI' : 'NON') }}</span>
                  <span class="option-dots"></span>
                  <span class="option-lettre">{{ lettre }}</span>
                </button>
              }
            </div>

            @if (enCours.question.sousTitreGroupeCD && lettresGroupe2.length) {
              <p class="groupe-titre">{{ enCours.question.sousTitreGroupeCD }}</p>
            }
            @if (lettresGroupe2.length) {
              <div class="options">
                @for (lettre of lettresGroupe2; track lettre) {
                  <button type="button" class="option"
                    [class.selected]="estSelectionnee(lettre) && !verrouille"
                    [class.correct]="verrouille && estBonneReponse(lettre)"
                    [class.incorrect]="verrouille && estSelectionnee(lettre) && !estBonneReponse(lettre)"
                    [disabled]="verrouille || envoi"
                    (click)="toggleReponse(lettre)">
                    <span class="option-check" [class.checked]="estSelectionnee(lettre)"></span>
                    <span class="option-texte">{{ texteReponse(lettre) || (lettre === 'C' ? 'OUI' : 'NON') }}</span>
                    <span class="option-dots"></span>
                    <span class="option-lettre">{{ lettre }}</span>
                  </button>
                }
              </div>
            }

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
              } @else {
                <button type="button" class="btn btn-primary" [disabled]="envoi" (click)="soumettre()">
                  Valider
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (resultat) {
      <div class="quiz-card resultat-card">
        <h2>Résultat — Série {{ resultat.serieNom }}</h2>
        <div class="score">{{ resultat.score }} / {{ resultat.totalQuestions }}</div>
        <p>Seuil de réussite : {{ resultat.seuilReussite }} / {{ resultat.totalQuestions }}</p>
        @if (resultat.statut === 'REUSSI') {
          <div class="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Série réussie ! La série suivante est débloquée.
          </div>
        }
        @if (resultat.statut === 'EXPIREE') {
          <div class="alert alert-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Le temps imparti pour cette série est écoulé.
          </div>
        }
        @if (resultat.statut === 'ECHEC') {
          <div class="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Série non réussie. {{ resultat.peutReprendre ? 'Il faut reprendre cette série.' : '' }}
          </div>
          @if (resultat.peutReprendre) {
            <button class="btn btn-warning" (click)="reprendreSerie()" [disabled]="loading" style="margin-bottom: 1rem; margin-right: 1rem;">
              Reprendre la série
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
      max-width: 920px;
      margin: 0 auto;
    }
    .quiz-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .serie-titre { font-weight: 800; font-size: 1.1rem; color: var(--primary); }
    .chrono { display:inline-flex; align-items:center; gap:0.3rem; color: var(--primary); font-weight: 600; }
    .chrono-warning { color: var(--danger); font-weight: 700; }
    .progress-bar { height: 6px; border-radius: 3px; background: var(--border-color); overflow: hidden; margin-bottom: 0.75rem; }
    .progress-fill { height: 100%; background: var(--primary); transition: width 0.2s; }
    .question-compteur { font-weight: 700; color: var(--text-muted); margin-bottom: 1rem; }
    .question-layout { display: flex; gap: 1.75rem; align-items: flex-start; flex-wrap: wrap; }
    .question-image { flex: 1 1 320px; max-width: 380px; text-align: center; }
    .question-image img { max-width: 100%; max-height: 320px; border-radius: var(--radius-md); }
    .question-body { flex: 1 1 320px; min-width: 280px; }
    .question-enonce { font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; }
    .groupe-titre { font-weight: 700; margin: 0.9rem 0 0.5rem; }
    .options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.5rem; }
    .option-check {
      width: 18px; height: 18px; flex-shrink: 0;
      border-radius: 4px; border: 1.5px solid var(--border-color);
      background: var(--bg-card);
    }
    .option-check.checked { background: var(--primary); border-color: var(--primary); }
    .option {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 1rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s;
      background: var(--bg-card);
      font: inherit;
      text-align: left;
      width: 100%;
    }
    .option-texte { white-space: nowrap; }
    .option-dots { flex: 1; border-bottom: 2px dotted var(--border-color); margin: 0 0.35rem; align-self: flex-end; height: 0.75em; min-width: 20px; }
    .option-lettre { font-weight: 800; color: var(--primary); }
    .option:hover:not(:disabled) { border-color: var(--primary); }
    .option.selected { border-color: var(--primary); background: var(--primary-light); }
    .option.correct { border-color: var(--success); background: var(--success-light); font-weight: 600; }
    .option.incorrect { border-color: var(--danger); background: var(--danger-light); font-weight: 600; }
    .option:disabled { cursor: default; }
    .option:disabled:not(.correct):not(.incorrect) { opacity: 0.6; }
    .quiz-actions { display: flex; justify-content: space-between; gap: 0.75rem; margin-top: 1.25rem; }
    .resultat-card { text-align: center; }
    .score { font-size: 2.5rem; font-weight: 800; color: var(--primary); margin: 0.75rem 0; }
    .correction-panel {
      margin-top: 1rem;
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
  reponsesSelectionnees = new Set<LettreReponse>();
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
    return !!this.enCours && this.enCours.indexQuestionCourante === this.enCours.totalQuestionsDeLaSerie - 1;
  }

  get progressionPct(): number {
    if (!this.enCours) return 0;
    return (this.enCours.indexQuestionCourante / this.enCours.totalQuestionsDeLaSerie) * 100;
  }

  /** Les options sont affichées par paire (A/B, puis C/D) pour pouvoir insérer un
   *  sous-titre de groupe entre les deux, façon examen officiel du Code de la route. */
  get lettresGroupe1(): LettreReponse[] {
    const toutes: LettreReponse[] = ['A', 'B', 'C', 'D'];
    return toutes.slice(0, Math.min(2, this.enCours?.question.nombreOptions ?? 2));
  }

  get lettresGroupe2(): LettreReponse[] {
    const total = this.enCours?.question.nombreOptions ?? 0;
    if (total <= 2) return [];
    const toutes: LettreReponse[] = ['A', 'B', 'C', 'D'];
    return toutes.slice(2, total);
  }

  texteReponse(lettre: LettreReponse): string | undefined {
    const q = this.enCours?.question;
    if (!q) return undefined;
    return { A: q.reponseA, B: q.reponseB, C: q.reponseC, D: q.reponseD }[lettre];
  }

  estSelectionnee(lettre: LettreReponse): boolean {
    return this.reponsesSelectionnees.has(lettre);
  }

  estBonneReponse(lettre: LettreReponse): boolean {
    return !!this.derniereCorrection?.bonnesReponses?.includes(lettre);
  }

  toggleReponse(lettre: LettreReponse): void {
    if (this.envoi || this.verrouille || !this.enCours) return;
    if (this.reponsesSelectionnees.has(lettre)) {
      this.reponsesSelectionnees.delete(lettre);
    } else {
      this.reponsesSelectionnees.add(lettre);
    }
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
    this.reponsesSelectionnees = new Set();
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

  soumettre(): void {
    if (this.envoi || !this.enCours) return;
    this.envoi = true;
    this.arreterMinuteur();
    this.apiService.repondreTentativeCode(this.tentativeId, Array.from(this.reponsesSelectionnees)).subscribe({
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

  reprendreSerie(): void {
    if (!this.resultat || !this.resultat.peutReprendre || this.loading) return;
    this.loading = true;
    this.error = '';
    this.apiService.demarrerSerieCode(this.resultat.serieId).subscribe({
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
        this.error = extraireMessageErreur(err, 'Impossible de reprendre la série.');
      }
    });
  }
}
