import { Routes } from '@angular/router';
import { authGuard, roleGuard, mustChangePasswordGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { PremiereConnexionComponent } from './pages/premiere-connexion/premiere-connexion.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CandidatsComponent } from './pages/candidats/candidats.component';
import { CandidatDetailComponent } from './pages/candidats/candidat-detail.component';
import { PaiementsComponent } from './pages/paiements/paiements.component';
import { ExamensComponent } from './pages/examens/examens.component';
import { CaisseComponent } from './pages/caisse/caisse.component';
import { RapportsComponent } from './pages/rapports/rapports.component';
import { UtilisateursComponent } from './pages/utilisateurs/utilisateurs.component';
import { ParametrageComponent } from './pages/parametrage/parametrage.component';
import { AuditComponent } from './pages/audit/audit.component';
import { ParametrageCodeComponent } from './pages/parametrage-code/parametrage-code.component';
import { CodeQuestionsComponent } from './pages/code-questions/code-questions.component';
import { CodeResultatsComponent } from './pages/code-resultats/code-resultats.component';
import { EspaceCandidatComponent } from './pages/espace-candidat/espace-candidat.component';
import { CodeQuizComponent } from './pages/espace-candidat/code-quiz.component';
import { CodeHistoriqueComponent } from './pages/espace-candidat/code-historique.component';

const ROLES_STAFF = ['ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR'];

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'premiere-connexion', component: PremiereConnexionComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ROLES_STAFF }
  },
  {
    path: 'candidats',
    component: CandidatsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR'] }
  },
  {
    path: 'candidats/:id',
    component: CandidatDetailComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR'] }
  },
  {
    path: 'paiements',
    component: PaiementsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CAISSIERE', 'SECRETAIRE'] }
  },
  {
    path: 'examens',
    component: ExamensComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MONITEUR', 'SECRETAIRE'] }
  },
  {
    path: 'caisse',
    component: CaisseComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CAISSIERE'] }
  },
  {
    path: 'rapports',
    component: RapportsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SECRETAIRE', 'CAISSIERE'] }
  },
  {
    path: 'utilisateurs',
    component: UtilisateursComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'parametrage',
    component: ParametrageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'parametrage-code',
    component: ParametrageCodeComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MONITEUR'] }
  },
  {
    path: 'code/resultats',
    component: CodeResultatsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MONITEUR'] }
  },
  {
    path: 'code/questions',
    component: CodeQuestionsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'audit',
    component: AuditComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'espace-candidat',
    component: EspaceCandidatComponent,
    canActivate: [authGuard, roleGuard, mustChangePasswordGuard],
    data: { roles: ['CANDIDAT'] }
  },
  {
    path: 'espace-candidat/historique',
    component: CodeHistoriqueComponent,
    canActivate: [authGuard, roleGuard, mustChangePasswordGuard],
    data: { roles: ['CANDIDAT'] }
  },
  {
    path: 'espace-candidat/code/:tentativeId',
    component: CodeQuizComponent,
    canActivate: [authGuard, roleGuard, mustChangePasswordGuard],
    data: { roles: ['CANDIDAT'] }
  },
  { path: '**', redirectTo: 'dashboard' }
];
