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
import { CreateBudgetDto, Budget, Category } from '../../core/models/api.models';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CategoryIconPipe } from '../../shared/icons/category-icon.pipe';

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
    IconComponent,
    CategoryIconPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 md:space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-display font-semibold text-content">
            {{ ts.t()('budgets.title') }}
          </h1>
          <p class="text-content-muted mt-1">
            {{ ts.t()('budgets.subtitle') }} {{ currentDate() | date : 'MMMM yyyy' }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-primary hover:bg-primary-dark text-primary-on rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
        >
          <app-icon name="add" [size]="22" class="mr-1 md:mr-2" />
          <span class="text-sm md:text-base font-bold">{{ ts.t()('budgets.create') }}</span>
        </button>
      </div>

      <!-- Budget Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        @if (isLoading() && budgets().length === 0) { @for (i of [1, 2, 3, 4, 5, 6]; track i) {
        <div
          class="glass-card p-6 animate-pulse bg-surface-2 border border-divider h-64"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-surface-3"></div>
              <div class="h-4 w-24 bg-surface-3 rounded"></div>
            </div>
            <div class="w-8 h-8 rounded-full bg-surface-3"></div>
          </div>
          <div class="space-y-4">
            <div class="h-3 w-full bg-surface-3 rounded"></div>
            <div class="h-3 w-3/4 bg-surface-3 rounded"></div>
          </div>
          <div class="mt-8 h-2 w-full bg-surface-3 rounded-full"></div>
          <div class="mt-4 flex justify-between">
            <div class="h-3 w-16 bg-surface-3 rounded"></div>
            <div class="h-3 w-16 bg-surface-3 rounded"></div>
          </div>
        </div>
        } } @for (budget of budgets(); track trackById($index, budget)) {
        <div
          class="glass-card p-6 group hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-surface-2 border border-divider"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center shadow-inner"
                [style.background-color]="(budget.category?.color || '#3b82f6') + '20'"
              >
                <app-icon [name]="(budget.category?.name || '') | categoryIcon: $safeNavigationMigration(budget.category?.icons)" [size]="26" [style.color]="budget.category?.color || '#3b82f6'" />
              </div>
              <div>
                <h3 class="font-bold text-content text-lg">
                  {{
                    budget.category ? ts.translateCategory(budget.category.name) : 'Uncategorized'
                  }}
                </h3>
                <p class="text-xs text-content-muted">
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
                class="p-2 text-content-subtle hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                [title]="ts.t()('trans.edit')"
              >
                <app-icon name="edit" [size]="24" />
              </button>
              <button
                (click)="confirmDelete(budget)"
                class="p-2 text-content-subtle hover:text-expense hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                [title]="ts.t()('trans.delete')"
              >
                <app-icon name="delete" [size]="24" />
              </button>
            </div>
          </div>

          <!-- New Layout: Percentage Left, Amount Right -->
          <div class="mt-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-lg font-bold text-content-muted">
                {{ calculateProgress(budget) | number : '1.0-0' }}%
              </span>
              <span class="text-sm font-medium text-content-muted">
                <span class="text-content font-bold">
                  {{ budget.spent | currency : 'DOP' : 'symbol' : '1.2-2' }}
                </span>
                / {{ budget.limit | currency : 'DOP' : 'symbol' : '1.2-2' }}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-surface-3 rounded-full h-3 overflow-hidden">
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
        <p class="text-content-muted text-lg">{{ ts.t()('budgets.no_budgets') }}</p>
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
        class="bg-surface-2 rounded-2xl shadow-2xl border border-divider w-full max-w-md overflow-hidden animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div
          class="p-6 border-b border-divider flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-content">
            {{ selectedBudget() ? ts.t()('budgets.edit') : ts.t()('budgets.create') }}
          </h2>
          <button
            (click)="closeModal()"
            class="text-content-subtle hover:text-content transition-colors"
          >
            <app-icon name="close" [size]="24" />
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-5">
          <!-- Category Select -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-content-muted uppercase tracking-wider"
            >
              {{ ts.t()('trans.category') }}
            </label>
            <div class="relative">
              <button
                type="button"
                (click)="toggleDropdown('category')"
                class="w-full flex items-center justify-between p-3 bg-surface-3 rounded-xl border border-divider text-left transition-colors hover:border-primary/50"
              >
                @if (getSelectedCategory(); as cat) {
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <app-icon [name]="cat.name | categoryIcon: cat.icons" [size]="14" />
                  </div>
                  <span class="text-content font-medium">
                    {{ ts.translateCategory(cat.name) }}
                  </span>
                </div>
                } @else {
                <span class="text-content-subtle">{{ ts.t()('trans.select_category') }}</span>
                }
                <app-icon name="expand_more" [size]="24" class="text-content-subtle" />
              </button>

              @if (openDropdown() === 'category') {
              <div
                class="absolute z-10 top-full left-0 right-0 mt-2 bg-surface-2 border border-divider rounded-xl shadow-xl max-h-60 overflow-y-auto no-scrollbar animate-fade-in"
              >
                @for (cat of categories(); track cat.id) {
                <button
                  type="button"
                  (click)="selectCategory(cat)"
                  class="w-full flex items-center gap-3 p-3 hover:bg-surface-3 transition-colors border-b border-divider last:border-0"
                >
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <app-icon [name]="cat.name | categoryIcon: cat.icons" [size]="14" />
                  </div>
                  <span class="text-content">
                    {{ ts.translateCategory(cat.name) }}
                  </span>
                </button>
                }
              </div>
              }
            </div>
            @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
            <p class="text-xs text-expense">{{ ts.t()('budgets.error_category') }}</p>
            }
          </div>

          <!-- Amount Limit -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-content-muted uppercase tracking-wider"
            >
              {{ ts.t()('budgets.limit') }}
            </label>
            <div class="relative">
              <span class="absolute left-3 top-3.5 text-content-muted font-bold"
                >$</span
              >
              <input
                formControlName="limit"
                type="text"
                inputmode="decimal"
                appCurrencyInput
                class="w-full pl-8 pr-4 py-3 bg-surface-3 border border-divider rounded-xl text-content font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-content-subtle"
                placeholder="0.00"
              />
            </div>
            @if (form.get('limit')?.invalid && form.get('limit')?.touched) {
            <p class="text-xs text-expense">{{ ts.t()('budgets.error_amount') }}</p>
            }
          </div>

          <!-- Recurring Toggle -->
          <div
            class="flex items-center justify-between p-4 bg-surface-3 rounded-xl border border-divider"
          >
            <div>
              <p class="font-medium text-content">
                {{ ts.t()('budgets.recurring_title') }}
              </p>
              <p class="text-xs text-content-muted">
                {{ ts.t()('budgets.recurring_desc') }}
              </p>
            </div>
            <button
              type="button"
              (click)="toggleRecurring()"
              class="w-12 h-6 rounded-full transition-colors relative"
              [ngClass]="
                form.get('isRecurring')?.value ? 'bg-primary' : 'bg-surface-3'
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
              class="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              <app-icon [name]="showAdvanced() ? 'expand_less' : 'expand_more'" [size]="20" />
              {{ ts.t()('budgets.advanced_options') }}
            </button>
          </div>

          @if (showAdvanced()) {
          <div
            class="space-y-4 pt-2 border-t border-divider animate-slide-down"
          >
            <!-- Warning Threshold -->
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-content-muted uppercase tracking-wider"
              >
                {{ ts.t()('budgets.warning_threshold') }}
              </label>
              <div class="relative">
                <button
                  type="button"
                  (click)="toggleDropdown('warning')"
                  class="w-full flex items-center justify-between p-3 bg-surface-3 rounded-xl border border-divider hover:border-primary/50"
                >
                  <span class="text-content font-medium">
                    {{ form.get('warningThreshold')?.value }}%
                  </span>
                  <app-icon name="expand_more" [size]="24" class="text-content-subtle" />
                </button>
                @if (openDropdown() === 'warning') {
                <div
                  class="absolute z-10 bottom-full left-0 right-0 mb-2 bg-surface-2 border border-divider rounded-xl shadow-xl overflow-hidden"
                >
                  @for (val of [50, 60, 70, 75, 80, 85, 90]; track val) {
                  <button
                    type="button"
                    (click)="selectWarning(val)"
                    class="w-full p-2 hover:bg-surface-3 text-content text-sm"
                  >
                    {{ val }}%
                  </button>
                  }
                </div>
                }
              </div>
              <p class="text-[10px] text-content-subtle">{{ ts.t()('budgets.notify_help') }}</p>
            </div>

            <!-- Critical Threshold -->
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-content-muted uppercase tracking-wider"
              >
                {{ ts.t()('budgets.critical_threshold') }}
              </label>
              <div class="relative">
                <button
                  type="button"
                  (click)="toggleDropdown('critical')"
                  class="w-full flex items-center justify-between p-3 bg-surface-3 rounded-xl border border-divider hover:border-primary/50"
                >
                  <span class="text-content font-medium">
                    {{ form.get('criticalThreshold')?.value }}%
                  </span>
                  <app-icon name="expand_more" [size]="24" class="text-content-subtle" />
                </button>
                @if (openDropdown() === 'critical') {
                <div
                  class="absolute z-10 bottom-full left-0 right-0 mb-2 bg-surface-2 border border-divider rounded-xl shadow-xl overflow-hidden"
                >
                  @for (val of [80, 85, 90, 95, 100]; track val) {
                  <button
                    type="button"
                    (click)="selectCritical(val)"
                    class="w-full p-2 hover:bg-surface-3 text-content text-sm"
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
                class="text-xs font-semibold text-content-muted uppercase tracking-wider"
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
                      ? 'bg-primary text-primary-on border-primary shadow-lg shadow-primary/20'
                      : 'bg-surface-2 border-divider text-content-muted hover:bg-surface-3'
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
            class="w-full py-3.5 bg-primary text-primary-on rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        class="glass-card w-full max-w-sm p-6 relative animate-scale-in bg-surface-2 border border-divider shadow-2xl text-center"
      >
        <div
          class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"
        >
          <app-icon name="warning" [size]="30" class="text-expense" />
        </div>
        <h3 class="text-xl font-bold text-content mb-2">
          {{ ts.t()('trans.delete_title') }}
        </h3>
        <p class="text-content-muted mb-6 text-sm">
          {{ ts.t()('trans.delete_msg') }}
        </p>
        <div class="flex space-x-3 justify-center">
          <button
            (click)="cancelDelete()"
            class="px-5 py-2.5 rounded-xl border border-divider text-content-muted font-medium hover:bg-surface-3 transition-colors"
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

  // Computed
  totalBudgeted = computed(() => {
    return this.budgets().reduce((acc: number, b: Budget) => acc + b.limit, 0);
  });

  totalSpent = computed(() => {
    return this.budgets().reduce((acc: number, b: Budget) => acc + b.spent, 0);
  });

  // UI State
  showModal = signal(false);
  isSubmitting = signal(false);
  showAdvanced = signal(false);
  showDeleteModal = signal(false);
  budgetToDelete = signal<Budget | null>(null);
  selectedBudget = signal<Budget | null>(null);
  openMenuId = signal<number | null>(null); // Added this

  // Custom Dropdowns
  openDropdown = signal<string | null>(null);

  // Form
  form: FormGroup;

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

  // Navigation
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

  toggleMenu(id: number, event: Event) {
    // Added this
    event.stopPropagation();
    this.openMenuId.update((current) => (current === id ? null : id));
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
      this.form.patchValue({
        limit: budget.limit,
        period: budget.period,
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

  selectPeriod(p: string) {
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
      // For updates, we usually only allow changing limits/thresholds, not category ideally,
      // but API might allow it. DTO usually forbids changing immutable props if strict.
      // But adhering to the form:

      // Optimistic Close
      this.closeModal();

      const cat = this.getSelectedCategory();
      this.state.updateBudget(this.selectedBudget()!.id, payload, cat).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.ns.show('Budget updated successfully', 'success');
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.ns.show(err.error?.message || 'Failed to update budget', 'error');
        },
      });
    } else {
      // Optimistic Close
      this.closeModal();

      this.state.addBudget(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.ns.show('Budget created successfully', 'success');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.ns.show(err.error?.message || 'Failed to create budget', 'error');
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
        this.ns.show('Budget deleted', 'success');
      },
      error: () => this.ns.show('Failed to delete budget', 'error'),
    });
  }
}
