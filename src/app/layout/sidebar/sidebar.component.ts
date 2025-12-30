import { Component, signal } from '@angular/core';
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
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 hidden lg:block transition-colors duration-300"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-white/5">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mr-3 shadow-lg shadow-primary/20"
        >
          <span class="text-white font-bold text-lg">S</span>
        </div>
        <span
          class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary dark:from-white dark:to-gray-400"
          >Spendly</span
        >
      </div>

      <!-- Nav -->
      <nav class="p-4 space-y-1">
        <a
          routerLink="/dashboard"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">dashboard</span>
          {{ ts.t()('nav.dashboard') }}
        </a>

        <a
          routerLink="/incomes"
          routerLinkActive="bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-teal-600 dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">trending_up</span>
          {{ ts.t()('nav.incomes') }}
        </a>

        <a
          routerLink="/expenses"
          routerLinkActive="bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-rose-600 dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">trending_down</span>
          {{ ts.t()('nav.expenses') }}
        </a>

        <a
          routerLink="/banks"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">account_balance</span>
          {{ ts.t()('nav.banks') }}
        </a>

        <a
          routerLink="/budgets"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">pie_chart</span>
          {{ ts.t()('nav.budgets') }}
        </a>

        <a
          routerLink="/goals"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">flag</span>
          {{ ts.t()('nav.goals') }}
        </a>

        <a
          routerLink="/reminders"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">notifications</span>
          {{ ts.t()('nav.reminders') }}
        </a>

        <a
          routerLink="/recurring"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">replay</span>
          {{ ts.t()('nav.recurring') }}
        </a>

        <a
          routerLink="/settings"
          routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
          class="flex items-center px-4 py-3 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span class="material-icons-outlined mr-3">settings</span>
          {{ ts.t()('nav.settings') }}
        </a>
      </nav>

      <!-- User Profile (Bottom) -->
      <div class="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-white/5">
        <div class="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-white font-semibold"
          >
            {{ (authService.currentUserStr() || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ authService.currentUserStr() || 'User' }}
            </p>
            <button
              (click)="authService.logout()"
              class="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              {{ ts.t()('nav.logout') }}
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [],
})
export class SidebarComponent {
  constructor(public authService: AuthService, public ts: TranslationService) {}
}
