import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  effect,
} from '@angular/core';
import { NgClass, DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { BudgetStateService } from '../../core/services/budget-state.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  Budget,
  Category,
  BudgetInputPeriod,
} from '../../core/models/api.models';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CurrencyInputDirective,
    NgClass,
    DecimalPipe,
    DatePipe,
    CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 md:space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('budgets.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ ts.t()('budgets.subtitle') }} {{ currentDate() | date : 'MMMM yyyy' }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
        >
          <span class="material-icons-outlined mr-1 md:mr-2 text-lg md:text-2xl">add</span>
          <span class="text-sm md:text-base font-bold">{{ ts.t()('budgets.create') }}</span>
        </button>
      </div>

      <!-- Budget Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        @if (isLoading() && budgets().length === 0) { @for (i of [1, 2, 3, 4, 5, 6]; track i) {
        <div
          class="glass-card p-6 animate-pulse bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 h-64"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10"></div>
              <div class="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded"></div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10"></div>
          </div>
          <div class="space-y-4">
            <div class="h-3 w-full bg-gray-200 dark:bg-white/10 rounded"></div>
            <div class="h-3 w-3/4 bg-gray-200 dark:bg-white/10 rounded"></div>
          </div>
          <div class="mt-8 h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full"></div>
          <div class="mt-4 flex justify-between">
            <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
            <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
          </div>
        </div>
        } } @for (budget of budgets(); track trackById($index, budget)) {
        <div
          class="glass-card p-6 group hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center shadow-inner"
                [style.background-color]="(budget.category?.color || '#3b82f6') + '20'"
              >
                <span
                  class="material-icons-outlined text-2xl"
                  [style.color]="budget.category?.color || '#3b82f6'"
                >
                  {{ budget.category?.icons || 'category' }}
                </span>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white text-lg">
                  {{
                    budget.category ? ts.translateCategory(budget.category.name) : 'Uncategorized'
                  }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ budget.period }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                (click)="openModal(budget)"
                class="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                [title]="ts.t()('trans.edit')"
              >
                <span class="material-icons-outlined text-xl">edit</span>
              </button>
              <button
                (click)="confirmDelete(budget)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                [title]="ts.t()('trans.delete')"
              >
                <span class="material-icons-outlined text-xl">delete</span>
              </button>
            </div>
          </div>

          <!-- New Layout: Percentage Left, Amount Right -->
          <div class="mt-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-lg font-bold text-gray-700 dark:text-gray-300">
                {{ calculateProgress(budget) | number : '1.0-0' }}%
              </span>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
                <span class="text-gray-900 dark:text-white font-bold">
                  {{ budget.spent | currency : 'DOP' : 'symbol' : '1.2-2' }}
                </span>
                / {{ budget.limit | currency : 'DOP' : 'symbol' : '1.2-2' }}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                [ngClass]="getProgressColor(budget)"
                [style.width.%]="calculateProgress(budget)"
              ></div>
            </div>
          </div>
        </div>
        }
      </div>

      @if (!isLoading() && budgets().length === 0) {
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400 text-lg">{{ ts.t()('budgets.no_budgets') }}</p>
      </div>
      }
    </div>

    <!-- Create/Edit Modal -->
    @defer (when showModal()) { @if (showModal()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeModal()"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md overflow-hidden animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div
          class="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ selectedBudget() ? ts.t()('budgets.edit') : ts.t()('budgets.create') }}
          </h2>
          <button
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-5">
          <!-- Category Select -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ ts.t()('trans.category') }}
            </label>
            <div class="relative">
              <button
                type="button"
                (click)="toggleDropdown('category')"
                class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left transition-colors hover:border-primary/50"
              >
                @if (getSelectedCategory(); as cat) {
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <span class="material-icons-outlined text-xs">{{ cat.icons }}</span>
                  </div>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ ts.translateCategory(cat.name) }}
                  </span>
                </div>
                } @else {
                <span class="text-gray-400">{{ ts.t()('trans.select_category') }}</span>
                }
                <span class="material-icons-outlined text-gray-400">expand_more</span>
              </button>

              @if (openDropdown() === 'category') {
              <div
                class="absolute z-10 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto no-scrollbar animate-fade-in"
              >
                @for (cat of categories(); track cat.id) {
                <button
                  type="button"
                  (click)="selectCategory(cat)"
                  class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <span class="material-icons-outlined text-xs">{{ cat.icons }}</span>
                  </div>
                  <span class="text-gray-700 dark:text-gray-200">
                    {{ ts.translateCategory(cat.name) }}
                  </span>
                </button>
                }
              </div>
              }
            </div>
            @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
            <p class="text-xs text-red-500">{{ ts.t()('budgets.error_category') }}</p>
            }
          </div>

          <!-- Amount Limit -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ ts.t()('budgets.limit') }}
            </label>
            <div class="relative">
              <span class="absolute left-3 top-3.5 text-gray-500 dark:text-gray-400 font-bold"
                >$</span
              >
              <input
                formControlName="limit"
                type="text"
                inputmode="decimal"
                appCurrencyInput
                class="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
            @if (form.get('limit')?.invalid && form.get('limit')?.touched) {
            <p class="text-xs text-red-500">{{ ts.t()('budgets.error_amount') }}</p>
            }
          </div>

          <!-- Period Selector -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ ts.t()('budgets.period') }}
            </label>
            @if (isLegacyPeriod()) {
            <div
              class="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium text-sm"
            >
              {{ selectedBudget()?.period }}
            </div>
            } @else {
            <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                (click)="form.patchValue({ period: 'MONTHLY' })"
                class="py-2 px-3 rounded-lg text-sm font-bold transition-all text-center"
                [ngClass]="
                  form.get('period')?.value === 'MONTHLY'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                "
              >
                {{ ts.t()('budgets.period_monthly') }}
              </button>
              <button
                type="button"
                (click)="form.patchValue({ period: 'YEARLY' })"
                class="py-2 px-3 rounded-lg text-sm font-bold transition-all text-center"
                [ngClass]="
                  form.get('period')?.value === 'YEARLY'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                "
              >
                {{ ts.t()('budgets.period_yearly') }}
              </button>
            </div>
            }
          </div>

          <!-- Recurring Toggle -->
          <div
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ ts.t()('budgets.recurring_title') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ ts.t()('budgets.recurring_desc') }}
              </p>
            </div>
            <button
              type="button"
              (click)="toggleRecurring()"
              class="w-12 h-6 rounded-full transition-colors relative"
              [ngClass]="
                form.get('isRecurring')?.value ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              "
            >
              <div
                class="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                [ngClass]="form.get('isRecurring')?.value ? 'translate-x-7' : 'translate-x-1'"
              ></div>
            </button>
          </div>

          <!-- Advanced Options Reveal -->
          <div>
            <button
              type="button"
              (click)="toggleAdvanced()"
              class="flex items-center gap-2 text-sm font-medium text-primary transition-colors"
            >
              <span class="material-icons-outlined text-lg">
                {{ showAdvanced() ? 'expand_less' : 'expand_more' }}
              </span>
              {{ ts.t()('budgets.advanced_options') }}
            </button>
          </div>

          @if (showAdvanced()) {
          <div
            class="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5"
          >
            <!-- Warning Threshold -->
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {{ ts.t()('budgets.warning_threshold') }}
              </label>
              <div class="relative">
                <button
                  type="button"
                  (click)="toggleDropdown('warning')"
                  class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50"
                >
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ form.get('warningThreshold')?.value }}%
                  </span>
                  <span class="material-icons-outlined text-gray-400">expand_more</span>
                </button>
                @if (openDropdown() === 'warning') {
                <div
                  class="absolute z-10 bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                >
                  @for (val of [50, 60, 70, 75, 80, 85, 90]; track val) {
                  <button
                    type="button"
                    (click)="selectWarning(val)"
                    class="w-full p-2 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-sm"
                  >
                    {{ val }}%
                  </button>
                  }
                </div>
                }
              </div>
              <p class="text-[10px] text-gray-400">{{ ts.t()('budgets.notify_help') }}</p>
            </div>

            <!-- Critical Threshold -->
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {{ ts.t()('budgets.critical_threshold') }}
              </label>
              <div class="relative">
                <button
                  type="button"
                  (click)="toggleDropdown('critical')"
                  class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50"
                >
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ form.get('criticalThreshold')?.value }}%
                  </span>
                  <span class="material-icons-outlined text-gray-400">expand_more</span>
                </button>
                @if (openDropdown() === 'critical') {
                <div
                  class="absolute z-10 bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                >
                  @for (val of [80, 85, 90, 95, 100]; track val) {
                  <button
                    type="button"
                    (click)="selectCritical(val)"
                    class="w-full p-2 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-sm"
                  >
                    {{ val }}%
                  </button>
                  }
                </div>
                }
              </div>
            </div>

            @if (form.get('isRecurring')?.value) {
            <!-- Repeat For (Months) -->
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {{ ts.t()('budgets.repeat_duration') }}
              </label>
              <div class="flex gap-2 flex-wrap">
                @for (r of [3, 6, 12, 24]; track r) {
                <button
                  type="button"
                  (click)="selectRepeat(r)"
                  class="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
                  [ngClass]="
                    form.get('numberOfPeriods')?.value === r
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  "
                >
                  {{ r }} Mo
                </button>
                }
              </div>
            </div>
            }
          </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting()"
            class="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (isSubmitting()) {
            <svg
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            }
            {{ selectedBudget() ? ts.t()('budgets.update') : ts.t()('budgets.create_btn') }}
          </button>
        </form>
      </div>
    </div>
    } }

    <!-- Delete Modal -->
    @if (showDeleteModal()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        class="glass-card w-full max-w-sm p-6 relative animate-scale-in bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl text-center"
      >
        <div
          class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons-outlined text-3xl text-red-500">warning</span>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ ts.t()('trans.delete_title') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          {{ ts.t()('trans.delete_msg') }}
        </p>
        <div class="flex space-x-3 justify-center">
          <button
            (click)="cancelDelete()"
            class="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {{ ts.t()('trans.cancel') }}
          </button>
          <button
            (click)="performDelete()"
            class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
          >
            {{ ts.t()('trans.delete') }}
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .animate-scale-in {
        animation: scaleIn 0.2s ease-out;
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.4s ease-out;
      }
      .animate-fade-in {
        animation: fadeIn 0.2s ease-out;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class BudgetsComponent implements OnInit {
  apiService = inject(ApiService);
  state = inject(BudgetStateService);
  ts = inject(TranslationService);
  ns = inject(NotificationService);
  fb = inject(FormBuilder);

  // Expose signals from state
  budgets = this.state.filteredBudgets;
  isLoading = this.state.isLoading;
  currentDate = this.state.currentDate;

  // Data
  categories = signal<Category[]>([]);

  // UI State
  showModal = signal(false);
  isSubmitting = signal(false);
  showAdvanced = signal(false);
  showDeleteModal = signal(false);
  budgetToDelete = signal<Budget | null>(null);
  selectedBudget = signal<Budget | null>(null);

  // Custom Dropdowns
  openDropdown = signal<string | null>(null);

  // Form
  form: FormGroup;

  periods: BudgetInputPeriod[] = ['MONTHLY', 'YEARLY'];

  isLegacyPeriod(): boolean {
    const p = this.selectedBudget()?.period;
    return p === 'DAILY' || p === 'WEEKLY';
  }

  constructor() {
    this.form = this.fb.group({
      limit: [null, [Validators.required, Validators.min(0.01)]],
      period: ['MONTHLY', Validators.required],
      categoryId: [null, Validators.required],
      warningThreshold: [75],
      criticalThreshold: [90],
      isRecurring: [false],
      numberOfPeriods: [6],
    });

    effect(() => {
      const list = this.budgets();
      list.forEach((b: Budget) => {
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
    this.state.load();
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error loading categories', err),
    });
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  // --- Display Helpers ---
  calculateProgress(budget: Budget): number {
    if (!budget.limit) return 0;
    const progress = (budget.spent / budget.limit) * 100;
    return Math.min(progress, 100);
  }

  getProgressColor(budget: Budget): string {
    const percentage = (budget.spent / budget.limit) * 100;
    if (percentage >= (budget.criticalThreshold || 90)) return 'bg-red-500';
    if (percentage >= (budget.warningThreshold || 75)) return 'bg-amber-400';
    return 'bg-green-500';
  }

  // --- Modal Logic ---

  openModal(budget: Budget | null = null) {
    this.selectedBudget.set(budget);

    if (budget) {
      const isLegacy = budget.period === 'DAILY' || budget.period === 'WEEKLY';
      this.form.patchValue({
        limit: budget.limit,
        period: isLegacy ? 'MONTHLY' : (budget.period as BudgetInputPeriod),
        categoryId: budget.category?.id,
        warningThreshold: budget.warningThreshold || 75,
        criticalThreshold: budget.criticalThreshold || 90,
        isRecurring: false,
        numberOfPeriods: null,
      });
    } else {
      this.form.reset({
        limit: null,
        period: 'MONTHLY',
        categoryId: null,
        warningThreshold: 75,
        criticalThreshold: 90,
        isRecurring: false,
        numberOfPeriods: 6,
      });
    }

    this.showModal.set(true);
    this.openDropdown.set(null);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedBudget.set(null);
    this.openDropdown.set(null);
  }

  toggleDropdown(name: string) {
    this.openDropdown.update((current) => (current === name ? null : name));
  }

  toggleAdvanced() {
    // Added this
    this.showAdvanced.update((v) => !v);
  }

  // --- Form Helper Logic ---

  selectCategory(cat: Category) {
    this.form.patchValue({ categoryId: cat.id });
    this.openDropdown.set(null);
  }

  getSelectedCategory() {
    const id = this.form.get('categoryId')?.value;
    return this.categories().find((c) => c.id === id);
  }

  selectPeriod(p: BudgetInputPeriod) {
    this.form.patchValue({ period: p });
    this.openDropdown.set(null);
  }

  selectWarning(val: number) {
    this.form.patchValue({ warningThreshold: val });
    this.openDropdown.set(null);
  }

  selectCritical(val: number) {
    this.form.patchValue({ criticalThreshold: val });
    this.openDropdown.set(null);
  }

  toggleRecurring() {
    const current = this.form.get('isRecurring')?.value;
    this.form.patchValue({ isRecurring: !current });
    if (!current) {
      // If enabling, ensure default
      if (!this.form.get('numberOfPeriods')?.value) {
        this.form.patchValue({ numberOfPeriods: 6 });
      }
    }
  }

  selectRepeat(val: number) {
    this.form.patchValue({ numberOfPeriods: val });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.form.value;

    const payload: CreateBudgetDto = {
      limit: formVal.limit,
      period: formVal.period,
      warningThreshold: formVal.warningThreshold,
      criticalThreshold: formVal.criticalThreshold,
      categoryId: formVal.categoryId, // Required for create
      isRecurring: formVal.isRecurring,
      numberOfPeriods: formVal.isRecurring ? formVal.numberOfPeriods : undefined,
    };

    if (this.selectedBudget()) {
      const isLegacy = this.isLegacyPeriod();
      const updatePayload: UpdateBudgetDto = {
        limit: formVal.limit,
        warningThreshold: formVal.warningThreshold,
        criticalThreshold: formVal.criticalThreshold,
        period: isLegacy ? undefined : formVal.period,
      };

      // Optimistic Close
      this.closeModal();

      const cat = this.getSelectedCategory();
      this.state.updateBudget(this.selectedBudget()!.id, updatePayload, cat).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.ns.show('budgets.updated', 'success');
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.ns.show(err.error?.message || 'budgets.update_failed', 'error');
        },
      });
    } else {
      // Optimistic Close
      this.closeModal();

      this.state.addBudget(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.ns.show('budgets.created', 'success');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.ns.show(err.error?.message || 'budgets.create_failed', 'error');
        },
      });
    }
  }

  // --- Deletion Logic ---

  confirmDelete(budget: Budget) {
    this.budgetToDelete.set(budget);
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.budgetToDelete.set(null);
  }

  performDelete() {
    const budget = this.budgetToDelete();
    if (!budget) return;

    // Optimistic Close
    this.cancelDelete();

    this.state.removeBudget(budget.id).subscribe({
      next: () => {
        this.ns.show('budgets.deleted', 'success');
      },
      error: () => this.ns.show('budgets.delete_failed', 'error'),
    });
  }
}
