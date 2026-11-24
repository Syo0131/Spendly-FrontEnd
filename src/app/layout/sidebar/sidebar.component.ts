import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-surface/95 backdrop-blur-xl border-r border-border hidden lg:flex lg:flex-col transition-colors duration-300"
    >
      <!-- Logo & Brand Header -->
      <div class="h-16 flex items-center px-6 border-b border-border shrink-0">
        <div
          class="w-8 h-8 rounded-lg bg-accent text-accent-contrast flex items-center justify-center mr-3 font-bold text-lg font-heading shadow-sm select-none"
        >
          S
        </div>
        <span class="text-xl font-bold tracking-tight text-ink font-heading select-none">
          Spendly
        </span>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
        <!-- Dashboard -->
        <a
          routerLink="/dashboard"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">dashboard</span>
          <span>{{ ts.t()('nav.dashboard') }}</span>
        </a>

        <!-- Expenses -->
        <a
          routerLink="/expenses"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">trending_down</span>
          <span>{{ ts.t()('nav.expenses') }}</span>
        </a>

        <!-- Incomes -->
        <a
          routerLink="/incomes"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">trending_up</span>
          <span>{{ ts.t()('nav.incomes') }}</span>
        </a>

        <!-- Budgets -->
        <a
          routerLink="/budgets"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">pie_chart</span>
          <span>{{ ts.t()('nav.budgets') }}</span>
        </a>

        <!-- Goals -->
        <a
          routerLink="/goals"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">flag</span>
          <span>{{ ts.t()('nav.goals') }}</span>
        </a>

        <!-- Reminders -->
        <a
          routerLink="/reminders"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">notifications</span>
          <span>{{ ts.t()('nav.reminders') }}</span>
        </a>

        <!-- Recurring -->
        <a
          routerLink="/recurring"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">replay</span>
          <span>{{ ts.t()('nav.recurring') }}</span>
        </a>

        <!-- Banks (with ✨ Premium badge) -->
        <a
          routerLink="/banks"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">account_balance</span>
          <span>{{ ts.t()('nav.banks') }}</span>
          <span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 tracking-wide uppercase">
            ✨ Premium
          </span>
        </a>

        <!-- Settings -->
        <a
          routerLink="/settings"
          routerLinkActive="bg-accent/15 text-accent font-semibold border-r-2 border-accent"
          class="flex items-center px-3.5 py-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium group select-none"
        >
          <span class="material-icons-outlined mr-3 text-xl group-hover:scale-105 transition-transform">settings</span>
          <span>{{ ts.t()('nav.settings') }}</span>
        </a>
      </nav>

      <!-- User Profile (Bottom) -->
      <div class="p-4 border-t border-border shrink-0">
        <div class="flex items-center p-3 rounded-xl bg-surface-raised border border-border/50 gap-3">
          <div
            class="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold flex items-center justify-center text-sm shrink-0 select-none"
          >
            {{ (authService.currentUserStr() || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink truncate leading-tight">
              {{ authService.currentUserStr() || 'User' }}
            </p>
            <button
              type="button"
              (click)="authService.logout()"
              class="text-xs text-expense hover:opacity-80 transition-opacity font-medium cursor-pointer"
            >
              {{ ts.t()('nav.logout') || 'Logout' }}
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  constructor(public authService: AuthService, public ts: TranslationService) {}
}
