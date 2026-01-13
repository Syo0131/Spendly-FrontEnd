import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
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
  ],
  template: `
    <div
      class="min-h-screen bg-gray-50 dark:bg-slate-900 flex text-slate-900 dark:text-white font-sans relative transition-colors duration-300 overflow-x-hidden"
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
          class="lg:hidden flex items-center justify-between px-4 py-2 pt-safe min-h-[3.5rem] border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/50 backdrop-blur sticky top-0 z-30 transition-colors duration-300"
        >
          <span
            class="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
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
                class="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 backdrop-blur-md transition-all text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white shadow-sm"
            >
                <span class="material-icons-outlined text-xl">notifications</span>
                @if (ns.unreadCount() > 0) {
                  <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                }
            </button>

            <!-- Notification Dropdown -->
            @if (showNotifications) {
              <div class="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 py-2 z-50 animate-fade-in-up origin-top-right overflow-hidden">
                <div class="px-4 py-2 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h3 class="font-bold text-sm text-gray-900 dark:text-white">{{ ts.t()('notif.title') }}</h3>
                    @if (ns.unreadCount() > 0) {
                      <button (click)="ns.markAllAsRead()" class="text-xs text-primary hover:underline">{{ ts.t()('notif.mark_read') }}</button>
                    }
                    @if (ns.unreadCount() === 0 && ns.history().length > 0) {
                      <button (click)="ns.clearHistory()" class="text-xs text-red-500 hover:underline">{{ ts.t()('notif.clear') }}</button>
                    }
                </div>
                
                <div class="max-h-80 overflow-y-auto">
                    @if (!ns.history().length) {
                      <div class="p-8 text-center text-gray-400 text-sm">
                          {{ ts.t()('notif.empty') }}
                      </div>
                    }
                    
                    @for (item of ns.history(); track item.timestamp) {
                      <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors flex gap-3" [class.bg-blue-50]="!item.read && false" [class.dark:bg-blue-900/10]="!item.read && false">
                           <div class="mt-0.5 shrink-0">
                              <span class="material-icons-outlined text-lg" [ngClass]="{'text-green-500': item.type === 'success', 'text-red-500': item.type === 'error', 'text-blue-500': item.type === 'info'}">
                                  {{ item.type === 'success' ? 'check_circle' : item.type === 'error' ? 'error' : 'info' }}
                              </span>
                           </div>
                           <div class="flex-1 min-w-0">
                               <p class="text-sm text-gray-800 dark:text-gray-200 leading-snug">{{ ts.translate(item.message) }}</p>
                               <p class="text-xs text-gray-400 mt-1">{{ formatDate(item.timestamp) }}</p>
                           </div>
                           @if (!item.read) {
                             <div class="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
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
        class="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50 pb-safe transition-colors duration-300"
      >
        <div class="h-16 grid grid-cols-6 items-center px-1">
        <a
          routerLink="/dashboard"
          routerLinkActive="text-primary"
          class="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-gray-300 transition-colors"
        >
          <span class="material-icons-outlined text-2xl mb-0.5">dashboard</span>
          <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
            ts.t()('nav.dashboard')
          }}</span>
        </a>

        
        <a
        routerLink="/incomes"
        routerLinkActive="text-teal-500 dark:text-teal-400"
        class="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-teal-500 dark:hover:text-gray-300 transition-colors"
        >
        <span class="material-icons-outlined text-2xl mb-0.5">trending_up</span>
        <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
          ts.t()('nav.incomes')
        }}</span>
        </a>
        
        <a
        routerLink="/expenses"
        routerLinkActive="text-rose-500 dark:text-rose-400"
        class="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-gray-300 transition-colors"
        >
        <span class="material-icons-outlined text-2xl mb-0.5">trending_down</span>
        <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
          ts.t()('nav.expenses')
        }}</span>
        </a>
        
        <a
          routerLink="/banks"
          routerLinkActive="text-primary"
          class="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-gray-300 transition-colors"
        >
          <span class="material-icons-outlined text-2xl mb-0.5">account_balance</span>
          <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
            ts.t()('nav.banks')
          }}</span>
        </a>
        <a
        routerLink="/budgets"
        routerLinkActive="text-primary"
        class="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-gray-300 transition-colors"
        >
        <span class="material-icons-outlined text-2xl mb-0.5">pie_chart</span>
        <span class="text-[9px] font-medium truncate w-full text-center px-0.5">{{
          ts.t()('nav.budgets')
        }}</span>
        </a>
        
        <!-- Menu Button (Replaces Settings) -->
        <button
          (click)="toggleMobileMenu()"
          class="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-gray-300 transition-colors"
        >
          <span class="material-icons-outlined text-2xl mb-0.5">menu</span>
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
            class="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform flex flex-col"
          >
            <div
              class="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center"
            >
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ ts.t()('nav.menu') }}
              </h2>
              <button
                (click)="closeMobileMenu()"
                class="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <span class="material-icons-outlined">close</span>
              </button>
            </div>
  
            <nav class="flex-1 overflow-y-auto p-4 space-y-2">
              <!-- New Features -->
              <a
                routerLink="/goals"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
                class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <span class="material-icons-outlined mr-3">flag</span>
                <span class="font-medium">{{ ts.t()('nav.goals') }}</span>
              </a>
  
              <a
                routerLink="/reminders"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300"
                class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <span class="material-icons-outlined mr-3">notifications</span>
                <span class="font-medium">{{ ts.t()('nav.reminders') }}</span>
              </a>
  
              <a
                routerLink="/recurring"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <span class="material-icons-outlined mr-3">replay</span>
                <span class="font-medium">{{ ts.t()('nav.recurring') }}</span>
              </a>
  
              <div class="my-4 border-t border-gray-100 dark:border-white/5"></div>
  
              <a
                routerLink="/settings"
                (click)="closeMobileMenu()"
                routerLinkActive="bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <span class="material-icons-outlined mr-3">settings</span>
                <span class="font-medium">{{ ts.t()('nav.settings') }}</span>
              </a>
  
              <!-- Logout Button -->
              <button
                (click)="authService.logout(); closeMobileMenu()"
                class="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors mt-4"
              >
                <span class="material-icons-outlined mr-3">logout</span>
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
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-white/10 relative overflow-hidden">
              <!-- Decorators -->
              <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
 
              <div class="flex flex-col items-center text-center gap-4">
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <span class="material-icons-outlined text-3xl text-blue-500">system_update</span>
                </div>
                
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {{ ts.translate('notif.update_available') }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Latest version is ready to install.
                    </p>
                </div>
 
                <button
                  (click)="updateService.reloadApp()"
                  class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
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
  private budgetState = inject(BudgetStateService);
  private expenseState = inject(ExpenseStateService);
  private incomeState = inject(IncomeStateService);
  private apiService = inject(ApiService);

  constructor() {
    this.prefetchData();
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

  private prefetchData() {
    // 1. Trigger State Services (Standard Page Size: 20 -> 6 to match UI)
    // This ensures data is ready when user navigates to these tabs.
    this.budgetState.load();
    this.expenseState.load(0, 6);
    this.incomeState.load(0, 6);

    // 2. Prefetch Dashboard specific stats (still direct API as they might not have state yet)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    this.apiService.getExpensesMonthTotal(year, month).subscribe({
      next: () => console.log('Month Total prefetched'),
      error: () => {},
    });

    this.apiService.getExpensesByCategory(year, month).subscribe({
      next: () => console.log('Category Stats prefetched'),
      error: () => {},
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: any) {
    if (event.key === 'Enter' && this.updateService.isUpdateAvailable()) {
      this.updateService.reloadApp();
    }
  }
}
