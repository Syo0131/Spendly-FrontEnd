import { Component, inject, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { NotificationService } from '../../core/services/notification.service';
import { UpdateService } from '../../core/services/update.service';
import { DataPreloadService } from '../../core/services/data-preload.service';
import { AlertService } from '../../core/services/alert.service';
import { ActionSheetComponent } from '../../shared/ui/organisms';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    RouterLink,
    RouterLinkActive,
    ToastComponent,
    ActionSheetComponent,
  ],
  template: `
    <div
      class="min-h-screen bg-canvas flex text-ink font-sans relative transition-colors duration-300 overflow-x-hidden"
    >
      <!-- Desktop Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 lg:ml-64 min-h-screen relative z-0 overflow-y-auto w-full pb-24 lg:pb-8 no-scrollbar">
        <!-- Desktop Floating Notifications -->
        <div class="hidden lg:flex absolute top-6 right-8 z-30 space-x-3 items-start">
          <ng-container *ngTemplateOutlet="notificationBell"></ng-container>
        </div>

        <!-- Topbar for Mobile -->
        <header
          class="lg:hidden flex items-center justify-between px-4 py-2 pt-safe min-h-[3.5rem] border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-30 transition-colors duration-300"
        >
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-accent text-accent-contrast flex items-center justify-center font-bold text-sm font-heading shadow-sm select-none">
              S
            </div>
            <span class="font-bold text-lg font-heading text-ink tracking-tight select-none">
              Spendly
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <ng-container *ngTemplateOutlet="notificationBell"></ng-container>
          </div>
        </header>

        <!-- Notification Bell & Dropdown Template -->
        <ng-template #notificationBell>
          <div class="relative">
            <button
              type="button"
              (click)="toggleNotifications()"
              aria-label="Notificaciones"
              class="flex items-center justify-center w-9 h-9 rounded-full bg-surface-raised hover:bg-surface-sunken border border-border transition-colors text-ink-muted hover:text-ink cursor-pointer shadow-sm relative"
            >
              <span class="material-icons-outlined text-xl">notifications</span>
              @if (ns.unreadCount() > 0) {
                <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-expense rounded-full border-2 border-surface"></span>
              }
            </button>

            <!-- Notification Dropdown -->
            @if (showNotifications()) {
              <div
                class="absolute right-0 top-11 w-80 bg-surface rounded-2xl shadow-2xl border border-border py-2 z-50 overflow-hidden"
              >
                <div class="px-4 py-2 border-b border-border flex justify-between items-center bg-surface-raised">
                  <h3 class="font-bold text-sm text-ink">{{ ts.t()('notif.title') }}</h3>
                  @if (ns.unreadCount() > 0) {
                    <button
                      type="button"
                      (click)="ns.markAllAsRead()"
                      class="text-xs text-accent hover:underline cursor-pointer"
                    >
                      {{ ts.t()('notif.mark_read') }}
                    </button>
                  }
                  @if (ns.unreadCount() === 0 && ns.history().length > 0) {
                    <button
                      type="button"
                      (click)="ns.clearHistory()"
                      class="text-xs text-expense hover:underline cursor-pointer"
                    >
                      {{ ts.t()('notif.clear') }}
                    </button>
                  }
                </div>

                <div class="max-h-80 overflow-y-auto">
                  @if (!ns.history().length) {
                    <div class="p-8 text-center text-ink-muted text-sm">
                      {{ ts.t()('notif.empty') }}
                    </div>
                  }

                  @for (item of ns.history(); track item.timestamp) {
                    <div
                      class="px-4 py-3 hover:bg-surface-raised border-b border-border last:border-0 transition-colors flex gap-3"
                    >
                      <div class="mt-0.5 shrink-0">
                        <span
                          class="material-icons-outlined text-lg"
                          [ngClass]="{
                            'text-emerald-500': item.type === 'success',
                            'text-expense': item.type === 'error',
                            'text-accent': item.type === 'info'
                          }"
                        >
                          {{ item.type === 'success' ? 'check_circle' : item.type === 'error' ? 'error' : 'info' }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-ink leading-snug">{{ ts.translate(item.message) }}</p>
                        <p class="text-xs text-ink-muted mt-1">{{ formatDate(item.timestamp) }}</p>
                      </div>
                      @if (!item.read) {
                        <div class="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0"></div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Backdrop for Notifications -->
            @if (showNotifications()) {
              <div class="fixed inset-0 z-40" (click)="showNotifications.set(false)"></div>
            }
          </div>
        </ng-template>

        <!-- Main Inner Route Viewport -->
        <div class="p-4 lg:p-8 max-w-7xl mx-auto">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Bottom Navigation (Mobile Only: 5 fixed tabs) -->
      <nav
        aria-label="Navegación principal móvil"
        class="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-border z-40 pb-safe transition-colors duration-300"
      >
        <div class="h-16 grid grid-cols-5 items-center px-1">
          <!-- 1. Inicio -->
          <a
            routerLink="/dashboard"
            routerLinkActive="text-accent font-semibold"
            class="flex flex-col items-center justify-center w-full h-full text-ink-muted hover:text-ink transition-colors select-none"
          >
            <span class="material-icons-outlined text-2xl mb-0.5">dashboard</span>
            <span class="text-[11px] font-medium truncate w-full text-center px-0.5 leading-none">
              {{ ts.t()('nav.dashboard') }}
            </span>
          </a>

          <!-- 2. Gastos -->
          <a
            routerLink="/expenses"
            routerLinkActive="text-accent font-semibold"
            class="flex flex-col items-center justify-center w-full h-full text-ink-muted hover:text-ink transition-colors select-none"
          >
            <span class="material-icons-outlined text-2xl mb-0.5">trending_down</span>
            <span class="text-[11px] font-medium truncate w-full text-center px-0.5 leading-none">
              {{ ts.t()('nav.expenses') }}
            </span>
          </a>

          <!-- 3. Ingresos -->
          <a
            routerLink="/incomes"
            routerLinkActive="text-accent font-semibold"
            class="flex flex-col items-center justify-center w-full h-full text-ink-muted hover:text-ink transition-colors select-none"
          >
            <span class="material-icons-outlined text-2xl mb-0.5">trending_up</span>
            <span class="text-[11px] font-medium truncate w-full text-center px-0.5 leading-none">
              {{ ts.t()('nav.incomes') }}
            </span>
          </a>

          <!-- 4. Límites (Budgets) -->
          <a
            routerLink="/budgets"
            routerLinkActive="text-accent font-semibold"
            class="flex flex-col items-center justify-center w-full h-full text-ink-muted hover:text-ink transition-colors select-none"
          >
            <span class="material-icons-outlined text-2xl mb-0.5">pie_chart</span>
            <span class="text-[11px] font-medium truncate w-full text-center px-0.5 leading-none">
              {{ ts.t()('nav.budgets') }}
            </span>
          </a>

          <!-- 5. Más (Drawer / Action Sheet) -->
          <button
            type="button"
            (click)="showMoreSheet.set(true)"
            aria-label="Más opciones"
            class="flex flex-col items-center justify-center w-full h-full text-ink-muted hover:text-ink transition-colors select-none cursor-pointer"
            [class.text-accent]="showMoreSheet()"
          >
            <span class="material-icons-outlined text-2xl mb-0.5">more_horiz</span>
            <span class="text-[11px] font-medium truncate w-full text-center px-0.5 leading-none">
              {{ ts.t()('nav.menu') || 'Más' }}
            </span>
          </button>
        </div>
      </nav>

      <!-- Mobile "Más" Action Sheet -->
      @if (showMoreSheet()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4">
          <ui-action-sheet
            [title]="ts.t()('nav.menu') || 'Más opciones'"
            (closed)="showMoreSheet.set(false)"
          >
            <div class="space-y-1">
              <!-- Metas -->
              <a
                routerLink="/goals"
                (click)="showMoreSheet.set(false)"
                routerLinkActive="bg-accent/15 text-accent font-semibold"
                class="flex items-center px-4 py-3 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium"
              >
                <span class="material-icons-outlined mr-3 text-xl">flag</span>
                <span>{{ ts.t()('nav.goals') }}</span>
              </a>

              <!-- Recordatorios -->
              <a
                routerLink="/reminders"
                (click)="showMoreSheet.set(false)"
                routerLinkActive="bg-accent/15 text-accent font-semibold"
                class="flex items-center px-4 py-3 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium"
              >
                <span class="material-icons-outlined mr-3 text-xl">notifications</span>
                <span>{{ ts.t()('nav.reminders') }}</span>
              </a>

              <!-- Recurrentes -->
              <a
                routerLink="/recurring"
                (click)="showMoreSheet.set(false)"
                routerLinkActive="bg-accent/15 text-accent font-semibold"
                class="flex items-center px-4 py-3 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium"
              >
                <span class="material-icons-outlined mr-3 text-xl">replay</span>
                <span>{{ ts.t()('nav.recurring') }}</span>
              </a>

              <!-- Bancos (with ✨ Premium badge) -->
              <a
                routerLink="/banks"
                (click)="showMoreSheet.set(false)"
                routerLinkActive="bg-accent/15 text-accent font-semibold"
                class="flex items-center px-4 py-3 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium"
              >
                <span class="material-icons-outlined mr-3 text-xl">account_balance</span>
                <span>{{ ts.t()('nav.banks') }}</span>
                <span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 tracking-wide uppercase">
                  ✨ Premium
                </span>
              </a>

              <div class="my-2 border-t border-border"></div>

              <!-- Ajustes -->
              <a
                routerLink="/settings"
                (click)="showMoreSheet.set(false)"
                routerLinkActive="bg-accent/15 text-accent font-semibold"
                class="flex items-center px-4 py-3 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors text-sm font-medium"
              >
                <span class="material-icons-outlined mr-3 text-xl">settings</span>
                <span>{{ ts.t()('nav.settings') }}</span>
              </a>

              <!-- Logout -->
              <button
                type="button"
                (click)="authService.logout(); showMoreSheet.set(false)"
                class="w-full flex items-center px-4 py-3 text-expense hover:bg-expense/10 rounded-xl transition-colors text-sm font-medium cursor-pointer"
              >
                <span class="material-icons-outlined mr-3 text-xl">logout</span>
                <span>{{ ts.t()('nav.logout') || 'Cerrar sesión' }}</span>
              </button>
            </div>
          </ui-action-sheet>
        </div>
      }

      <!-- Global Toast Notifications -->
      <app-toast></app-toast>

      <!-- Update Modal with Semantic Tokens -->
      @if (updateService.isUpdateAvailable()) {
        <div
          class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            class="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-border text-center space-y-4"
          >
            <div class="w-12 h-12 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
              <span class="material-icons-outlined text-2xl">system_update</span>
            </div>

            <div>
              <h3 class="text-lg font-bold text-ink">
                {{ ts.translate('notif.update_available') }}
              </h3>
              <p class="text-sm text-ink-muted mt-1">
                La nueva versión de Spendly está lista para instalarse.
              </p>
            </div>

            <button
              type="button"
              (click)="updateService.reloadApp()"
              class="w-full py-2.5 bg-accent text-accent-contrast font-semibold rounded-xl transition-transform active:scale-98 shadow-sm cursor-pointer"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class MainLayoutComponent {
  showMoreSheet = signal<boolean>(false);
  showNotifications = signal<boolean>(false);

  ts = inject(TranslationService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  ns = inject(NotificationService);
  updateService = inject(UpdateService);
  private preloadService = inject(DataPreloadService);
  private alertService = inject(AlertService);

  constructor() {
    this.preloadService.preloadAll();
    this.alertService.init();
  }

  ngOnDestroy() {
    this.alertService.stop();
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.showMoreSheet()) {
      this.showMoreSheet.set(false);
    }
    if (this.showNotifications()) {
      this.showNotifications.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.updateService.isUpdateAvailable()) {
      this.updateService.reloadApp();
    }
  }
}
