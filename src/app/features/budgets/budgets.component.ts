import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { ApiService } from '../../core/services/api.service';
import { Budget, CreateBudgetDto, Category } from '../../core/models/api.models';
import { FormsModule } from '@angular/forms';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { NotificationService } from '../../core/services/notification.service';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInputDirective, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 pb-24 md:pb-6 space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ ts.t()('budgets.title') || 'Budgets' }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Control your expenses and save more
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Month Navigation -->
          <div
            class="flex items-center bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 shadow-sm"
          >
            <button
              (click)="prevMonth()"
              class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors active:scale-95"
            >
              <span class="material-icons-outlined text-lg">chevron_left</span>
            </button>
            <div
              class="px-3 font-bold text-sm text-gray-900 dark:text-white min-w-[140px] text-center select-none uppercase tracking-wide cursor-default"
            >
              {{ currentDate() | date : 'MMMM yyyy' }}
            </div>
            <button
              (click)="nextMonth()"
              class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors active:scale-95"
            >
              <span class="material-icons-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <button
            (click)="openModal()"
            class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 font-semibold text-sm tracking-wide"
          >
            <span class="material-icons-outlined mr-2 text-lg">add_circle</span>
            {{ ts.t()('budgets.add') || 'New' }}
          </button>
        </div>
      </div>

      <!-- Skeleton Loader -->
      <div
        *ngIf="isLoading() && budgets().length === 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse"
      >
        <div
          *ngFor="let i of [1, 2, 3, 4, 5, 6]"
          class="p-5 border border-gray-200 dark:border-white/5 rounded-2xl bg-white/5"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10"></div>
              <div class="space-y-1.5">
                <div class="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div class="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded"></div>
            <div class="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full"></div>
            <div class="flex justify-between">
              <div class="h-3 w-10 bg-gray-200 dark:bg-white/10 rounded"></div>
              <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!isLoading() && budgets().length === 0"
        class="glass-card p-12 text-center border border-gray-200 dark:border-white/10 animate-fade-in rounded-2xl"
      >
        <div
          class="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600"
            >calendar_today</span
          >
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
          No budgets for {{ currentDate() | date : 'MMMM' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
          You haven't created any budgets for this month yet.
        </p>
        <button
          (click)="openModal()"
          class="text-primary hover:text-primary-light font-semibold hover:underline text-sm"
        >
          {{ ts.t()('budgets.add') }}
        </button>
      </div>

      <!-- Budgets Grid -->
      <div
        *ngIf="budgets().length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div
          *ngFor="let budget of budgets(); trackBy: trackById"
          class="glass-card p-5 border border-gray-100 dark:border-white/5 relative group hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900"
        >
          <!-- Header Card -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <!-- Category Icon -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                [style.background-color]="(budget.category?.color || '#3b82f6') + '15'"
              >
                <span
                  class="material-icons-outlined text-lg"
                  [style.color]="budget.category?.color || '#3b82f6'"
                >
                  {{ budget.category?.icons || 'category' }}
                </span>
              </div>

              <!-- Title & Labels -->
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">
                  {{ budget.category?.name || 'Budget' }}
                </h3>
                <div class="flex items-center gap-1.5 leading-none">
                  <!-- Period Badge -->
                  <span
                    class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5 flex items-center h-5"
                  >
                    {{ budget.period }}
                  </span>

                  <!-- Alert Badge -->
                  <span
                    *ngIf="budget.warningThreshold"
                    class="flex items-center text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 h-5"
                    title="Warning Threshold"
                  >
                    <span class="material-icons-outlined text-[10px] mr-1"
                      >notification_important</span
                    >
                    {{ budget.warningThreshold }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Delete Button (Hover) -->
            <button
              (click)="confirmDelete(budget)"
              class="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <span class="material-icons-outlined text-base">delete_outline</span>
            </button>
          </div>

          <!-- Progress & Amounts (Goals Style) -->
          <div class="mt-4">
            <div class="flex justify-between items-end mb-2">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ calculateProgress(budget) | number : '1.0-0' }}%
              </span>
              <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                DOP {{ budget.spent | number : '1.2-2' }} /
                {{ budget.limit | number : '1.2-2' }}
              </span>
            </div>

            <div class="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                class="h-3 rounded-full transition-all duration-1000 ease-out relative"
                [style.width.%]="calculateProgress(budget)"
                [ngClass]="getProgressColor(budget)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      *ngIf="showModal"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 px-4 sm:px-0"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
      <div
        class="glass-card w-full max-w-md p-6 relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl"
        @scaleIn
      >
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
        >
          <span class="material-icons-outlined text-lg">close</span>
        </button>

        <div class="text-center mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-primary"
              >account_balance_wallet</span
            >
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('budgets.add') }}
          </h2>
          <p class="text-gray-500 text-xs mt-1">
            Set limits to your spending for {{ currentDate() | date : 'MMMM' }}
          </p>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-5">
          <!-- Limit Input -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
              >Daily Limit</label
            >
            <div class="relative group">
              <span
                class="absolute left-4 top-3.5 text-gray-500 dark:text-gray-400 font-bold text-lg"
                >$</span
              >
              <input
                type="text"
                inputmode="decimal"
                appCurrencyInput
                [(ngModel)]="newBudget.limit"
                name="limit"
                required
                placeholder="0.00"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-lg font-bold rounded-xl p-3 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
              />
            </div>
          </div>

          <!-- Category & Period Grid -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Category -->
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Category</label
              >

              <div class="relative">
                <div
                  (click)="toggleDropdown('category')"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <ng-container *ngIf="getSelectedCategory() as selected; else catPlaceholder">
                      <div
                        class="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        [style.background-color]="selected.color + '20'"
                      >
                        <span
                          class="material-icons-outlined text-xs"
                          [style.color]="selected.color"
                          >{{ selected.icons }}</span
                        >
                      </div>
                      <span class="text-gray-900 dark:text-white font-semibold text-xs truncate">{{
                        selected.name
                      }}</span>
                    </ng-container>
                    <ng-template #catPlaceholder>
                      <span class="material-icons-outlined text-gray-400 text-lg">category</span>
                      <span class="text-gray-400 text-xs font-medium">Select</span>
                    </ng-template>
                  </div>
                  <span
                    class="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors text-lg"
                    >expand_more</span
                  >
                </div>

                <div
                  *ngIf="openDropdown() === 'category'"
                  class="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl max-h-52 overflow-y-auto custom-scrollbar animate-scale-in"
                >
                  <div
                    *ngFor="let cat of categories(); trackBy: trackById"
                    (click)="selectCategory(cat)"
                    class="p-2.5 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-50 dark:border-white/5 last:border-0"
                  >
                    <div
                      class="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      [style.background-color]="cat.color + '20'"
                    >
                      <span class="material-icons-outlined text-xs" [style.color]="cat.color">{{
                        cat.icons
                      }}</span>
                    </div>
                    <span class="text-gray-700 dark:text-gray-200 font-medium text-xs">{{
                      cat.name
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Period -->
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Period</label
              >
              <div class="relative">
                <div
                  (click)="toggleDropdown('period')"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group"
                >
                  <div class="flex items-center gap-2">
                    <span class="material-icons-outlined text-gray-400 text-lg">date_range</span>
                    <span class="text-gray-900 dark:text-white font-semibold text-xs">{{
                      newBudget.period | titlecase
                    }}</span>
                  </div>
                  <span
                    class="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors text-lg"
                    >expand_more</span
                  >
                </div>

                <div
                  *ngIf="openDropdown() === 'period'"
                  class="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-scale-in"
                >
                  <div
                    *ngFor="let p of periods"
                    (click)="selectPeriod(p)"
                    class="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 font-medium text-xs text-gray-700 dark:text-gray-300"
                  >
                    {{ p | titlecase }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Thresholds -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Warning %</label
              >
              <div class="relative">
                <div
                  (click)="toggleDropdown('alert')"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span class="text-gray-900 dark:text-white font-bold text-xs"
                      >{{ selectedAlertPercent }}%</span
                    >
                  </div>
                  <span class="material-icons-outlined text-gray-400 text-lg">expand_more</span>
                </div>
                <div
                  *ngIf="openDropdown() === 'alert'"
                  class="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-scale-in"
                >
                  <div
                    *ngFor="let a of alertOptions"
                    (click)="selectAlert(a.value)"
                    class="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-xs font-medium border-b border-gray-50 dark:border-white/5 last:border-0 text-gray-700 dark:text-gray-300"
                  >
                    {{ a.label }}
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Critical %</label
              >
              <div class="relative">
                <div
                  (click)="toggleDropdown('critical')"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span class="text-gray-900 dark:text-white font-bold text-xs"
                      >{{ selectedCriticalPercent }}%</span
                    >
                  </div>
                  <span class="material-icons-outlined text-gray-400 text-lg">expand_more</span>
                </div>
                <div
                  *ngIf="openDropdown() === 'critical'"
                  class="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-scale-in"
                >
                  <div
                    *ngFor="let a of criticalOptions"
                    (click)="selectCritical(a.value)"
                    class="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-xs font-medium border-b border-gray-50 dark:border-white/5 last:border-0 text-gray-700 dark:text-gray-300"
                  >
                    {{ a.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recurring -->
          <div
            class="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5"
          >
            <div
              class="flex items-center justify-between cursor-pointer"
              (click)="isRecurring = !isRecurring"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-white/5"
                >
                  <span class="material-icons-outlined text-lg">loop</span>
                </div>
                <div>
                  <p class="font-bold text-gray-900 dark:text-white text-xs">Recurring Budget?</p>
                </div>
              </div>

              <div
                class="relative inline-block w-9 h-5 transition duration-200 ease-in-out rounded-full cursor-pointer"
                [ngClass]="isRecurring ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
              >
                <span
                  class="absolute left-0.5 top-0.5 inline-block w-4 h-4 bg-white border border-gray-200 rounded-full shadow transform transition-transform duration-200 ease-in-out"
                  [ngClass]="isRecurring ? 'translate-x-full border-primary' : 'translate-x-0'"
                ></span>
              </div>
            </div>

            <div
              *ngIf="isRecurring"
              class="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 animate-fade-in"
            >
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Repeat For (Months)</label
              >
              <div class="flex gap-2 mt-2">
                <button
                  *ngFor="let r of repeatOptions"
                  (click)="selectRepeat(r)"
                  class="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all"
                  [ngClass]="
                    numberOfPeriods === r
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  "
                >
                  {{ r }}
                </button>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting"
            class="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
          >
            <span
              *ngIf="isSubmitting"
              class="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
            ></span>
            {{ isSubmitting ? 'Saving...' : ts.t()('trans.save') || 'Save Budget' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      *ngIf="showDeleteModal"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="glass-card w-full max-w-sm p-6 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl"
        @scaleIn
      >
        <div
          class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-3 text-red-500"
        >
          <span class="material-icons-outlined text-2xl">delete_forever</span>
        </div>

        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Delete Budget?</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
          Are you sure you want to delete the
          <span class="font-bold text-gray-900 dark:text-white">{{
            budgetToDelete?.category?.name
          }}</span>
          budget? This action cannot be undone.
        </p>

        <div class="flex gap-3">
          <button
            (click)="cancelDelete()"
            class="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            (click)="performDelete()"
            class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  `,
})
export class BudgetsComponent implements OnInit {
  apiService = inject(ApiService); // Still needed for Categories
  state = inject(BudgetStateService); // Inject state
  ts = inject(TranslationService);
  ns = inject(NotificationService);

  // Expose signals from state
  budgets = this.state.filteredBudgets;
  isLoading = this.state.isLoading;

  currentDate = this.state.currentDate;

  categories = signal<Category[]>([]);

  // Modal State
  showModal = false;
  isSubmitting = false;

  // Delete Modal State
  showDeleteModal = false;
  budgetToDelete: Budget | null = null;

  // Custom Dropdowns
  openDropdown = signal<string | null>(null);
  periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

  alertOptions = [
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 80, label: '80%' },
    { value: 90, label: '90%' },
  ];

  criticalOptions = [
    { value: 80, label: '80%' },
    { value: 90, label: '90%' },
    { value: 95, label: '95%' },
    { value: 100, label: '100% (On Limit)' },
  ];

  repeatOptions = [3, 6, 9, 12];

  // Form State
  newBudget: Partial<CreateBudgetDto> = {
    period: 'MONTHLY',
  };
  selectedAlertPercent = 75;
  selectedCriticalPercent = 90;

  isRecurring = false;
  numberOfPeriods = 6; // Default to 6 per user requirement/example
  private notifiedBudgetIds = new Set<number>();

  constructor() {
    effect(() => {
      const list = this.budgets();
      list.forEach((b) => {
        if (b.limit > 0 && b.warningThreshold) {
          const pct = (b.spent / b.limit) * 100;
          if (pct >= b.warningThreshold && !this.state.hasNotified(b.id)) {
            const catName = b.category?.name || 'Budget';
            const isOver = pct >= 100;
            const key = isOver ? 'notif.budget_exceeded' : 'notif.budget_warning';

            const msg = this.ts.translate(key, {
              category: catName,
              percent: pct.toFixed(0),
            });

            this.ns.show(msg, isOver ? 'error' : 'info');
            this.state.markNotified(b.id);
          }
        }
      });
    });
  }

  ngOnInit() {
    // Trigger load on init, but service will skip if already loaded
    this.state.load();
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error loading categories', err),
    });
  }

  // Navigation Methods (Delegated to State)
  prevMonth() {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() - 1);
    this.state.setDate(date);
  }

  nextMonth() {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + 1);
    this.state.setDate(date);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  // Dropdown Logic
  toggleDropdown(name: string) {
    if (this.openDropdown() === name) {
      this.openDropdown.set(null);
    } else {
      this.openDropdown.set(name);
    }
  }

  selectCategory(idx: Category) {
    this.newBudget.categoryId = idx.id;
    this.openDropdown.set(null);
  }

  getSelectedCategory() {
    return this.categories().find((c) => c.id === this.newBudget.categoryId);
  }

  selectPeriod(p: any) {
    this.newBudget.period = p;
    this.openDropdown.set(null);
  }

  selectAlert(val: number) {
    this.selectedAlertPercent = val;
    this.openDropdown.set(null);
  }

  selectCritical(val: number) {
    this.selectedCriticalPercent = val;
    this.openDropdown.set(null);
  }

  selectRepeat(val: number) {
    this.numberOfPeriods = val;
    // this.openDropdown.set(null); // Keep open for buttons
  }

  openModal() {
    this.showModal = true;
    this.newBudget = { period: 'MONTHLY' };
    this.selectedAlertPercent = 75;
    this.selectedCriticalPercent = 90;
    this.isRecurring = false;
    this.numberOfPeriods = 6;
    this.openDropdown.set(null);
  }

  closeModal() {
    this.showModal = false;
    this.openDropdown.set(null);
  }

  onSubmit() {
    if (!this.newBudget.limit || !this.newBudget.categoryId || !this.newBudget.period) return;

    this.isSubmitting = true;

    const payload: CreateBudgetDto = {
      limit: this.newBudget.limit,
      period: this.newBudget.period,
      categoryId: this.newBudget.categoryId,
      warningThreshold: this.selectedAlertPercent, // Send percentage
      criticalThreshold: this.selectedCriticalPercent, // Send percentage
      isRecurring: this.isRecurring,
      numberOfPeriods: this.isRecurring ? this.numberOfPeriods : undefined,
    };

    // Use State Service to Add
    this.state.addBudget(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.ns.show('Budget created successfully', 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.ns.show(err.error?.message || 'Failed to create budget', 'error');
      },
    });
  }

  confirmDelete(budget: Budget) {
    this.budgetToDelete = budget;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.budgetToDelete = null;
  }

  performDelete() {
    if (!this.budgetToDelete) return;

    // Use State Service to Remove
    this.state.removeBudget(this.budgetToDelete.id).subscribe({
      next: () => {
        this.ns.show('Budget deleted', 'success');
      },
      error: () => {
        this.ns.show('Failed to delete budget', 'error');
      },
    });

    this.cancelDelete();
  }

  calculateProgress(budget: Budget): number {
    if (budget.limit === 0 || !budget.limit) return 0;
    const progress = (budget.spent / budget.limit) * 100;
    return Math.min(progress, 100);
  }

  calculateRemaining(budget: Budget): number {
    return (budget.limit || 0) - (budget.spent || 0);
  }

  getProgressColor(budget: Budget): string {
    const pct = this.calculateProgress(budget);

    // Check critical threshold first (higher priority)
    if (budget.criticalThreshold && pct >= budget.criticalThreshold) {
      return 'bg-red-500';
    }

    // Check warning threshold
    if (budget.warningThreshold && pct >= budget.warningThreshold) {
      return 'bg-amber-500';
    }

    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-primary';
  }

  getProgressTextColor(budget: Budget): string {
    const pct = this.calculateProgress(budget);
    if (budget.criticalThreshold && pct >= budget.criticalThreshold) return 'text-red-500';
    if (budget.warningThreshold && pct >= budget.warningThreshold) return 'text-amber-500';
    if (pct >= 100) return 'text-red-500';
    return 'text-primary';
  }
}
