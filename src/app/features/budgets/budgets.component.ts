import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  HostListener,
  inject,
  effect,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { budgetPercent, budgetStatus, BudgetStatus } from '../../core/utils/budget-status';
import {
  ButtonComponent,
  AmountComponent,
  IconComponent,
  SkeletonComponent,
  ProgressBarComponent,
  CategoryBadgeComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  FormFieldComponent,
  CurrencyInputComponent,
  CategoryPickerComponent,
  SegmentedControlComponent,
  SegmentedControlOption,
  ToggleComponent,
  DialogShellComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    AmountComponent,
    IconComponent,
    SkeletonComponent,
    ProgressBarComponent,
    CategoryBadgeComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    CategoryPickerComponent,
    SegmentedControlComponent,
    ToggleComponent,
    DialogShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <ui-page-header
        [title]="ts.t()('budgets.title')"
        [subtitle]="headerSubtitle()"
      >
        <div uiHeaderActions class="flex items-center gap-2">
          <button
            uiButton
            variant="primary"
            size="md"
            type="button"
            (click)="openModal()"
            class="h-9 whitespace-nowrap"
          >
            <ui-icon name="add" size="sm" />
            <span>{{ ts.t()('budgets.create') }}</span>
          </button>
        </div>
      </ui-page-header>

      <!-- Main Budget Grid / List -->
      @if (isLoading() && budgets().length === 0) {
        <!-- Skeleton Loading Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div
              class="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between h-48 space-y-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <ui-skeleton shape="circle" customClass="w-10 h-10" />
                  <ui-skeleton shape="line" customClass="h-4 w-28" />
                </div>
                <ui-skeleton shape="line" customClass="h-6 w-14" />
              </div>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <ui-skeleton shape="line" customClass="h-4 w-12" />
                  <ui-skeleton shape="line" customClass="h-4 w-24" />
                </div>
                <ui-skeleton shape="line" customClass="h-2 w-full" />
              </div>
            </div>
          }
        </div>
      } @else if (budgets().length === 0) {
        <!-- Empty State -->
        <ui-empty-state
          icon="pie_chart"
          [title]="ts.t()('budgets.title')"
          [description]="ts.t()('budgets.no_budgets')"
        >
          <button
            uiButton
            variant="primary"
            uiEmptyAction
            type="button"
            (click)="openModal()"
          >
            <ui-icon name="add" size="sm" />
            <span>{{ ts.t()('budgets.create') }}</span>
          </button>
        </ui-empty-state>
      } @else {
        <!-- Budget Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (budget of budgets(); track budget.id) {
            <div
              class="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm hover:border-accent/40 transition-colors"
            >
              <!-- Card Top Header -->
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="flex items-center gap-2.5 min-w-0">
                  <ui-category-badge
                    [name]="
                      budget.category
                        ? ts.translateCategory(budget.category.name)
                        : ts.t()('trans.general')
                    "
                    [icon]="budget.category?.icons ?? null"
                    [color]="budget.category?.color ?? null"
                    size="md"
                  />
                  <span
                    class="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-raised border border-border text-ink-muted uppercase tracking-wider shrink-0"
                  >
                    {{
                      budget.period === 'YEARLY'
                        ? ts.t()('budgets.period_yearly')
                        : ts.t()('budgets.period_monthly')
                    }}
                  </span>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    uiButton
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    (click)="openModal(budget)"
                    [attr.aria-label]="ts.t()('trans.edit')"
                    [title]="ts.t()('trans.edit')"
                  >
                    <ui-icon name="edit" size="sm" class="text-ink-muted hover:text-accent" />
                  </button>
                  <button
                    type="button"
                    uiButton
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    (click)="confirmDelete(budget)"
                    [attr.aria-label]="ts.t()('trans.delete')"
                    [title]="ts.t()('trans.delete')"
                  >
                    <ui-icon
                      name="delete"
                      size="sm"
                      class="text-ink-muted hover:text-expense"
                    />
                  </button>
                </div>
              </div>

              <!-- Amounts & Progress -->
              <div class="mt-2 space-y-2.5">
                <div class="flex items-center justify-between text-xs sm:text-sm">
                  <span class="font-mono font-bold tabular-nums text-ink text-base">
                    {{ getPercent(budget) }}%
                  </span>
                  <span class="text-ink-muted text-xs">
                    <ui-amount [value]="budget.spent" tone="neutral" size="sm" />
                    <span class="mx-1">/</span>
                    <ui-amount [value]="budget.limit" tone="neutral" size="sm" />
                  </span>
                </div>

                <ui-progress-bar
                  [label]="budget.category?.name || 'Budget'"
                  [percent]="getPercent(budget)"
                  [status]="getStatus(budget)"
                  thickness="regular"
                />
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="closeModal()"
      >
        <div class="w-full max-w-lg" (click)="$event.stopPropagation()">
          <ui-dialog-shell
            [title]="selectedBudget() ? ts.t()('budgets.edit') : ts.t()('budgets.create')"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeModal()"
          >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- Category Picker -->
              <ui-form-field [label]="ts.t()('trans.category')" fieldId="budget-category">
                <ui-category-picker
                  [categories]="categories()"
                  [placeholder]="ts.t()('trans.select_category')"
                  formControlName="categoryId"
                />
              </ui-form-field>

              <!-- Amount Limit -->
              <ui-form-field [label]="ts.t()('budgets.limit')" fieldId="budget-limit">
                <ui-currency-input inputId="budget-limit" formControlName="limit" />
              </ui-form-field>

              <!-- Period Selector -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {{ ts.t()('budgets.period') }}
                </label>
                @if (isLegacyPeriod()) {
                  <div
                    class="p-2.5 bg-surface-raised border border-border rounded-lg text-ink font-medium text-sm"
                  >
                    {{ selectedBudget()?.period }}
                  </div>
                } @else {
                  <ui-segmented-control
                    [options]="periodOptions()"
                    formControlName="period"
                  />
                }
              </div>

              <!-- Recurring Toggle -->
              <div
                class="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-border"
              >
                <div>
                  <p class="font-medium text-ink text-sm">{{ ts.t()('budgets.recurring_title') }}</p>
                  <p class="text-xs text-ink-muted">{{ ts.t()('budgets.recurring_desc') }}</p>
                </div>
                <ui-toggle formControlName="isRecurring" />
              </div>

              <!-- Advanced Options Reveal -->
              <div class="pt-1">
                <button
                  type="button"
                  (click)="toggleAdvanced()"
                  class="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline transition-colors"
                >
                  <ui-icon [name]="showAdvanced() ? 'expand_less' : 'expand_more'" size="sm" />
                  <span>{{ ts.t()('budgets.advanced_options') }}</span>
                </button>
              </div>

              @if (showAdvanced()) {
                <div class="space-y-4 pt-2 border-t border-border animate-fade-in">
                  <!-- Warning Threshold -->
                  <ui-form-field
                    [label]="ts.t()('budgets.warning_threshold')"
                    fieldId="warning-threshold"
                    [hint]="ts.t()('budgets.notify_help')"
                  >
                    <select
                      id="warning-threshold"
                      formControlName="warningThreshold"
                      class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      @for (val of [50, 60, 70, 75, 80, 85, 90]; track val) {
                        <option [value]="val">{{ val }}%</option>
                      }
                    </select>
                  </ui-form-field>

                  <!-- Critical Threshold -->
                  <ui-form-field
                    [label]="ts.t()('budgets.critical_threshold')"
                    fieldId="critical-threshold"
                  >
                    <select
                      id="critical-threshold"
                      formControlName="criticalThreshold"
                      class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      @for (val of [80, 85, 90, 95, 100]; track val) {
                        <option [value]="val">{{ val }}%</option>
                      }
                    </select>
                  </ui-form-field>

                  <!-- Repeat Duration (if recurring) -->
                  @if (form.get('isRecurring')?.value) {
                    <div class="space-y-1.5">
                      <label
                        class="text-xs font-semibold text-ink-muted uppercase tracking-wider"
                      >
                        {{ ts.t()('budgets.repeat_duration') }}
                      </label>
                      <div class="flex gap-2">
                        @for (r of [3, 6, 12, 24]; track r) {
                          <button
                            type="button"
                            (click)="form.patchValue({ numberOfPeriods: r })"
                            uiButton
                            [variant]="
                              form.get('numberOfPeriods')?.value === r ? 'primary' : 'secondary'
                            "
                            size="sm"
                            class="flex-1"
                          >
                            {{ r }} Mo
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Dialog Footer Buttons -->
              <div uiDialogFooter class="flex items-center justify-end gap-2.5">
                <button type="button" uiButton variant="secondary" (click)="closeModal()">
                  {{ ts.t()('trans.cancel') }}
                </button>
                <button
                  type="submit"
                  uiButton
                  variant="primary"
                  [disabled]="form.invalid || isSubmitting()"
                  [loading]="isSubmitting()"
                >
                  {{ selectedBudget() ? ts.t()('budgets.update') : ts.t()('budgets.create_btn') }}
                </button>
              </div>
            </form>
          </ui-dialog-shell>
        </div>
      </div>
    }
  `,
})
export class BudgetsComponent implements OnInit {
  apiService = inject(ApiService);
  state = inject(BudgetStateService);
  ts = inject(TranslationService);
  ns = inject(NotificationService);
  dialogService = inject(UiDialogService);
  fb = inject(FormBuilder);

  // State Signals
  budgets = this.state.filteredBudgets;
  isLoading = this.state.isLoading;
  currentDate = this.state.currentDate;

  // Data
  categories = signal<Category[]>([]);

  // UI State
  showModal = signal(false);
  isSubmitting = signal(false);
  showAdvanced = signal(false);
  selectedBudget = signal<Budget | null>(null);

  // Period Options for Segmented Control
  periodOptions = computed<SegmentedControlOption<BudgetInputPeriod>[]>(() => [
    { value: 'MONTHLY', label: this.ts.t()('budgets.period_monthly') },
    { value: 'YEARLY', label: this.ts.t()('budgets.period_yearly') },
  ]);

  headerSubtitle = computed(() => {
    const base = this.ts.t()('budgets.subtitle');
    const date = this.currentDate();
    const loc = this.ts.currentLang() === 'es' ? 'es-DO' : 'en-US';
    const monthYear = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(date);
    return `${base} ${monthYear}`;
  });

  form: FormGroup;

  isLegacyPeriod(): boolean {
    const p = this.selectedBudget()?.period;
    return p === 'DAILY' || p === 'WEEKLY';
  }

  constructor() {
    this.form = this.fb.group({
      limit: [null, [Validators.required, Validators.min(0.01)]],
      period: ['MONTHLY' as BudgetInputPeriod, Validators.required],
      categoryId: [null as number | null, Validators.required],
      warningThreshold: [75],
      criticalThreshold: [90],
      isRecurring: [false],
      numberOfPeriods: [6],
    });

    // Threshold toasts effect
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

  // Display calculations via pure budget-status logic
  getPercent(b: Budget): number {
    return budgetPercent(b.spent, b.limit);
  }

  getStatus(b: Budget): BudgetStatus {
    return budgetStatus(b.spent, b.limit, b.warningThreshold, b.criticalThreshold);
  }

  getSelectedCategory(): Category | undefined {
    const id = this.form.get('categoryId')?.value;
    return this.categories().find((c) => c.id === id);
  }

  // Modal logic
  openModal(budget: Budget | null = null) {
    this.selectedBudget.set(budget);

    if (budget) {
      const isLegacy = budget.period === 'DAILY' || budget.period === 'WEEKLY';
      this.form.patchValue({
        limit: budget.limit,
        period: isLegacy ? 'MONTHLY' : (budget.period as BudgetInputPeriod),
        categoryId: budget.category?.id ?? null,
        warningThreshold: budget.warningThreshold || 75,
        criticalThreshold: budget.criticalThreshold || 90,
        isRecurring: false,
        numberOfPeriods: 6,
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
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedBudget.set(null);
  }

  toggleAdvanced() {
    this.showAdvanced.update((v) => !v);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.form.value;

    const payload: CreateBudgetDto = {
      limit: Number(formVal.limit),
      period: formVal.period,
      warningThreshold: Number(formVal.warningThreshold),
      criticalThreshold: Number(formVal.criticalThreshold),
      categoryId: Number(formVal.categoryId),
      isRecurring: formVal.isRecurring,
      numberOfPeriods: formVal.isRecurring ? Number(formVal.numberOfPeriods) : undefined,
    };

    if (this.selectedBudget()) {
      const isLegacy = this.isLegacyPeriod();
      const updatePayload: UpdateBudgetDto = {
        limit: Number(formVal.limit),
        warningThreshold: Number(formVal.warningThreshold),
        criticalThreshold: Number(formVal.criticalThreshold),
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

  async confirmDelete(budget: Budget) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('budgets.deleted') || this.ts.t()('trans.delete_title'),
      message: this.ts.t()('trans.delete_msg'),
      confirmLabel: this.ts.t()('trans.delete'),
      cancelLabel: this.ts.t()('trans.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      this.state.removeBudget(budget.id).subscribe({
        next: () => {
          this.ns.show('budgets.deleted', 'success');
        },
        error: () => this.ns.show('budgets.delete_failed', 'error'),
      });
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showModal()) {
        this.closeModal();
      }
    } else if (event.key === 'Enter') {
      if (this.showModal() && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.onSubmit();
      }
    } else if ((event.altKey && event.key === 'n') || (event.altKey && event.key === 'N')) {
      if (!this.showModal()) {
        event.preventDefault();
        this.openModal();
      }
    }
  }
}
