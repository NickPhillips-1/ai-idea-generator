import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'questionnaires',
    canActivate: [authGuard],
    loadComponent: () => import('./features/questionnaires/questionnaire-page').then((m) => m.QuestionnairePage),
  },
  {
    path: 'alignments',
    canActivate: [authGuard],
    loadComponent: () => import('./features/alignments/alignment-page').then((m) => m.AlignmentPage),
  },
  {
    path: 'directions',
    canActivate: [authGuard],
    loadComponent: () => import('./features/directions/direction-page').then((m) => m.DirectionPage),
  },
  {
    path: 'research',
    canActivate: [authGuard],
    loadComponent: () => import('./features/research/research-page').then((m) => m.ResearchPage),
  },
  {
    path: 'opportunities',
    canActivate: [authGuard],
    loadComponent: () => import('./features/opportunities/opportunity-page').then((m) => m.OpportunityPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
