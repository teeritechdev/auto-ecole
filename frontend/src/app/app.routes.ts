import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
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

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
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
    path: 'audit',
    component: AuditComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: '**', redirectTo: 'dashboard' }
];
