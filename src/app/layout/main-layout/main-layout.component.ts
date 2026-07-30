import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { UpdateService } from '../../core/services/update.service';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { ExpenseStateService } from '../../core/services/expense-state.service';
import { IncomeStateService } from '../../core/services/income-state.service';
import { DataPreloadService } from '../../core/services/data-preload.service';
import { AlertService } from '../../core/services/alert.service'; // Added AlertService

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
    IconComponent,
  ],
  template: `
    <div
      class="min-h-screen bg-surface flex text-content font-sans relative transition-colors duration-300 overflow-x-hidden"
    >
      <!-- Desktop Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <!-- Main Content Area -->
      <main class="flex-1 lg:ml-64 min-h-screen relative z-0 overflow-y-auto w-full pb-20 lg:pb-0 no-scrollbar">
        <!-- Desktop Tools (Floating Top-Right) -->
        <div class="hidden lg:flex absolute top-6 right-8 z-30 space-x-3 items-start">
            
          <!-- Notifications -->
          <ng-container *ngTemplateOutlet="notificationBell"></ng-container>
        </div>

        <!-- Topbar for Mobile -->
        <header
          class="lg:hidden flex items-center justify-between px-4 py-2 pt-safe min-h-[3.5rem] border-b border-divider bg-surface-2/80 backdrop-blur sticky top-0 z-30 transition-colors duration-300"
        >
          <span
            class="font-display font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
            >Spendly</span
          >
          <div class="flex items-center space-x-2">
            <ng-container *ngTemplateOutlet="notificationBell"></ng-container>
          </div>
        </header>

        <ng-template #notificationBell>
          <div class="relative">
            <button
                (click)="toggleNotifications()"
                class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-2 hover:bg-surface-3 border border-divider backdrop-blur-md transition-all text-content-muted hover:text-primary shadow-sm"
            >
                <app-icon name="notifications" [size]="22" />
                @if (ns.unreadCount() > 0) {
                  <span class="absolute top-0 right-0 w-3 h-3 bg-expense rounded-full border-2 border-surface-2"></span>
                }
            </button>

            <!-- Notification Dropdown -->
            @if (showNotifications) {
              <div class="absolute right-0 top-12 w-80 bg-surface-2 rounded-2xl shadow-xl border border-divider py-2 z-50 animate-fade-in-up origin-top-right overflow-hidden">
                <div class="px-4 py-2 border-b border-divider flex justify-between items-center bg-surface-3">
                    <h3 class="font-bold text-sm text-content">{{ ts.t()('notif.title') }}</h3>
                    @if (ns.unreadCount() > 0) {
                      <button (click)="ns.markAllAsRead()" class="text-xs text-primary hover:underline">{{ ts.t()('notif.mark_read') }}</button>
                    }
                    @if (ns.unreadCount() === 0 && ns.history().length > 0) {
                      <button (click)="ns.clearHistory()" class="text-xs text-expense hover:underline">{{ ts.t()('notif.clear') }}</button>
                    }
                </div>
                
                <div class="max-h-80 overflow-y-auto">
                    @if (!ns.history().length) {
                      <div class="p-8 text-center text-content-subtle text-sm">
                          {{ ts.t()('notif.empty') }}
                      </div>
                    }
                    
                    @for (item of ns.history(); track item.timestamp) {
                      <div class="px-4 py-3 hover:bg-surface-3 border-b border-divider last:border-0 transition-colors flex gap-3">
                           <div class="mt-0.5 shrink-0">
                              <app-icon
                                [size]="18"
                                [ngClass]="{'text-success': item.type === 'success', 'text-expense': item.type === 'error', 'text-primary-ink': item.type === 'info'}"
                                [name]="item.type === 'success' ? 'check_circle' : item.type === 'error' ? 'error' : 'info'"
                              />
                           </div>
                           <div class="flex-1 min-w-0">
                               <p class="text-sm text-content leading-snug">{{ ts.translate(item.message) }}</p>
                               <p class="text-xs text-content-subtle mt-1">{{ formatDate(item.timestamp) }}</p>
                           </div>
                           @if (!item.read) {
                             <div class="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                           }
                      </div>
                    }
                </div>
            </div>
            }
            
            <!-- Backdrop for Notifications -->
            @if (showNotifications) {
              <div class="fixed inset-0 z-40" (click)="showNotifications = false"></div>
            }
          </div>
        </ng-template>

        <div class="p-4 lg:p-8 max-w-7xl mx-auto pt-16 lg:pt-8">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Bottom Navigation (Mobile Only) -->
      <div
        class="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-2/90 backdrop-blur-xl border-t border-divider z-50 pb-safe transition-colors duration-300"
      >
        <div class="h-16 grid grid-cols-6 items-center px-1">
        <a
          routerLink="/dashboard"
          routerLinkActive="text-primary"
          class="flex flex-col items-center justify-center w-full h-full text-content-subtle hover:text-primary transition-colors"
        >
          <app-icon name="dashboard" [size]="26" class="mb-0.5" />
          <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
            ts.t()('nav.dashboard')
          }}</span>
        </a>

        
        <a
        routerLink="/incomes"
        routerLinkActive="text-primary-ink"
        class="flex flex-col items-center justify-center w-full h-full text-content-subtle hover:text-primary transition-colors"
        >
        <app-icon name="trending_up" [size]="26" class="mb-0.5" />
        <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
          ts.t()('nav.incomes')
        }}</span>
        </a>
        
        <a
        routerLink="/expenses"
        routerLinkActive="text-primary-ink"
        class="flex flex-col items-center justify-center w-full h-full text-content-subtle hover:text-primary transition-colors"
        >
        <app-icon name="trending_down" [size]="26" class="mb-0.5" />
        <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
          ts.t()('nav.expenses')
        }}</span>
        </a>
        
        <a
          routerLink="/banks"
          routerLinkActive="text-primary"
          class="flex flex-col items-center justify-center w-full h-full text-content-subtle hover:text-primary transition-colors"
        >
          <app-icon name="account_balance" [size]="26" class="mb-0.5" />
          <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
            ts.t()('nav.banks')
          }}</span>
        </a>
        <a
        routerLink="/budgets"
        routerLinkActive="text-primary"
        class="flex flex-col items-center justify-center w-full h-full text-content-subtle hover:text-primary transition-colors"
        >
        <app-icon name="pie_chart" [size]="26" class="mb-0.5" />
        <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
          ts.t()('nav.budgets')
        }}</span>
        </a>
        
        <!-- Menu Button (Replaces Settings) -->
        <button
          (click)="toggleMobileMenu()"
          class="flex flex-col items-center justify-center w-full h-full text-content-subtle hover:text-primary transition-colors"
        >
          <app-icon name="menu" [size]="26" class="mb-0.5" />
          <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
            ts.t()('nav.menu')
          }}</span>
        </button>
        </div>
      </div>

      <!-- Mobile Side Menu Drawer -->
      @if (showMobileMenu) {
        <div
          class="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            (click)="closeMobileMenu()"
          ></div>
  
          <!-- Drawer -->
          <div
            class="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-surface-2 shadow-2xl transition-transform duration-300 transform flex flex-col"
          >
            <div
              class="p-6 border-b border-divider flex justify-between items-center"
            >
              <h2 class="text-lg font-bold text-content">
                {{ ts.t()('nav.menu') }}
              </h2>
              <button
                (click)="closeMobileMenu()"
                class="p-2 -mr-2 text-content-muted hover:text-content transition-colors"
              >
                <app-icon name="close" [size]="24" />
              </button>
            </div>
  
            <nav class="flex-1 overflow-y-auto p-4 space-y-2">
              <!-- New Features -->
              <a
                routerLink="/categories"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-primary/10 text-primary-ink font-semibold"
                class="flex items-center px-4 py-3 text-content-muted rounded-xl hover:bg-surface-3 transition-colors"
              >
                <app-icon name="category" [size]="22" class="mr-3" />
                <span class="font-medium">{{ ts.t()('nav.categories') }}</span>
              </a>

              <a
                routerLink="/goals"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-primary/10 text-primary-ink font-semibold"
                class="flex items-center px-4 py-3 text-content-muted rounded-xl hover:bg-surface-3 transition-colors"
              >
                <app-icon name="flag" [size]="22" class="mr-3" />
                <span class="font-medium">{{ ts.t()('nav.goals') }}</span>
              </a>
  
              <a
                routerLink="/reminders"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-primary/10 text-primary-ink font-semibold"
                class="flex items-center px-4 py-3 text-content-muted rounded-xl hover:bg-surface-3 transition-colors"
              >
                <app-icon name="notifications" [size]="22" class="mr-3" />
                <span class="font-medium">{{ ts.t()('nav.reminders') }}</span>
              </a>
  
              <a
                routerLink="/recurring"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-primary/10 text-primary-ink font-semibold"
                class="flex items-center px-4 py-3 text-content-muted rounded-xl hover:bg-surface-3 transition-colors"
              >
                <app-icon name="replay" [size]="22" class="mr-3" />
                <span class="font-medium">{{ ts.t()('nav.recurring') }}</span>
              </a>
  
              <div class="my-4 border-t border-divider"></div>
  
              <a
                routerLink="/settings"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-surface-3 text-content font-semibold"
                class="flex items-center px-4 py-3 text-content-muted rounded-xl hover:bg-surface-3 transition-colors"
              >
                <app-icon name="settings" [size]="22" class="mr-3" />
                <span class="font-medium">{{ ts.t()('nav.settings') }}</span>
              </a>
  
              <!-- Logout Button -->
              <button
                (click)="authService.logout(); closeMobileMenu()"
                class="w-full flex items-center px-4 py-3 text-expense hover:bg-expense/10 rounded-xl transition-colors mt-4"
              >
                <app-icon name="logout" [size]="22" class="mr-3" />
                <span class="font-medium">{{ ts.t()('nav.logout') || 'Logout' }}</span>
              </button>
            </nav>
          </div>
        </div>
      }
      
      <!-- Global Toast Container -->
      <app-toast></app-toast>
      <!-- Update Modal -->
      @if (updateService.isUpdateAvailable()) {
        <div
          class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div class="bg-surface-2 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-divider relative overflow-hidden">
              <!-- Decorators -->
              <div class="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
 
              <div class="flex flex-col items-center text-center gap-4">
                <div class="p-3 bg-primary/10 rounded-full">
                  <app-icon name="system_update" [size]="30" class="text-primary-ink" />
                </div>
                
                <div>
                    <h3 class="text-xl font-bold text-content mb-1">
                      {{ ts.translate('notif.update_available') }}
                    </h3>
                    <p class="text-sm text-content-muted">
                      Latest version is ready to install.
                    </p>
                </div>
 
                <button
                  (click)="updateService.reloadApp()"
                  class="w-full py-3 bg-primary hover:bg-primary-dark text-primary-on font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  Refresh Now
                </button>
              </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [],
})
export class MainLayoutComponent {
  showMobileMenu = false;
  showNotifications = false;

  ts = inject(TranslationService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  ns = inject(NotificationService);
  updateService = inject(UpdateService);

  // State Services for Preloading
  // private budgetState = inject(BudgetStateService);
  // private expenseState = inject(ExpenseStateService);
  // private incomeState = inject(IncomeStateService);
  // private apiService = inject(ApiService);
  private preloadService = inject(DataPreloadService);
  private alertService = inject(AlertService); // Inject it

  constructor() {
    this.preloadService.preloadAll();
    this.alertService.init(); // Start polling for alerts
  }

  ngOnDestroy() {
    this.alertService.stop(); // Stop polling when layout is destroyed (e.g. logout/nav change if layout changes)
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  // private prefetchData moved to DataPreloadService
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: any) {
    if (event.key === 'Enter' && this.updateService.isUpdateAvailable()) {
      this.updateService.reloadApp();
    }
  }
}
