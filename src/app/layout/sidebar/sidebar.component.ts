import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-surface-2 border-r border-divider hidden lg:block transition-colors duration-300"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-divider">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mr-3 shadow-lg shadow-primary/20"
        >
          <span class="text-primary-on font-bold text-lg">S</span>
        </div>
        <span class="font-display text-xl font-semibold tracking-tight text-content">Spendly</span>
      </div>

      <!-- Nav -->
      <nav class="p-4 space-y-1">
        @for (item of navItems; track item.link) {
        <a
          [routerLink]="item.link"
          routerLinkActive="bg-primary/10 text-primary-ink font-semibold"
          class="flex items-center px-4 py-3 text-content-muted rounded-xl hover:bg-surface-3 hover:text-content transition-all font-medium"
        >
          <app-icon [name]="item.icon" class="mr-3" [size]="22" />
          {{ ts.t()(item.label) }}
        </a>
        }
      </nav>

      <!-- User Profile (Bottom) -->
      <div class="absolute bottom-0 w-full p-4 border-t border-divider">
        <div class="flex items-center p-3 rounded-xl bg-surface-3 space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary-ink font-display font-semibold"
          >
            {{ (authService.currentUserStr() || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-content truncate">
              {{ authService.currentUserStr() || 'User' }}
            </p>
            <button
              (click)="authService.logout()"
              class="text-xs text-expense hover:opacity-80 transition-opacity"
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
  readonly navItems = [
    { link: '/dashboard', icon: 'dashboard', label: 'nav.dashboard' },
    { link: '/incomes', icon: 'trending_up', label: 'nav.incomes' },
    { link: '/expenses', icon: 'trending_down', label: 'nav.expenses' },
    { link: '/categories', icon: 'category', label: 'nav.categories' },
    { link: '/banks', icon: 'account_balance', label: 'nav.banks' },
    { link: '/budgets', icon: 'pie_chart', label: 'nav.budgets' },
    { link: '/goals', icon: 'flag', label: 'nav.goals' },
    { link: '/reminders', icon: 'notifications', label: 'nav.reminders' },
    { link: '/recurring', icon: 'replay', label: 'nav.recurring' },
    { link: '/settings', icon: 'settings', label: 'nav.settings' },
  ];

  constructor(public authService: AuthService, public ts: TranslationService) {}
}
