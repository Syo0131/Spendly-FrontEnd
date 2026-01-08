import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    title: 'Login / Sign Up | Spendly',
    canActivate: [publicGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'oauth/callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback/oauth-callback.component').then(
        (m) => m.OAuthCallbackComponent
      ),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard | Spendly',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'incomes',
        title: 'Incomes | Spendly',
        loadComponent: () =>
          import('./features/incomes/incomes.component').then((m) => m.IncomesComponent),
      },
      {
        path: 'expenses',
        title: 'Expenses | Spendly',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent),
      },
      { path: 'transactions', redirectTo: 'expenses' }, // Fallback
      {
        path: 'banks',
        title: 'My Banks | Spendly',
        loadComponent: () =>
          import('./features/banks/banks.component').then((m) => m.BanksComponent),
      },
      {
        path: 'budgets',
        title: 'Budgets | Spendly',
        loadComponent: () =>
          import('./features/budgets/budgets.component').then((m) => m.BudgetsComponent),
      },
      {
        path: 'goals',
        title: 'Financial Goals | Spendly',
        loadComponent: () =>
          import('./features/goals/goals.component').then((m) => m.GoalsComponent),
      },
      {
        path: 'reminders',
        title: 'Reminders | Spendly',
        loadComponent: () =>
          import('./features/reminders/reminders.component').then((m) => m.RemindersComponent),
      },
      {
        path: 'recurring',
        title: 'Recurring Transactions | Spendly',
        loadComponent: () =>
          import('./features/recurring/recurring.component').then((m) => m.RecurringComponent),
      },
      {
        path: 'settings',
        title: 'Settings | Spendly',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
