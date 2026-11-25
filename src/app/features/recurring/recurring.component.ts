import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecurringStateService } from '../../core/services/recurring-state.service';
import {
  RecurringExpense,
  CreateRecurringExpenseDto,
  Category,
} from '../../core/models/api.models';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import {
  ButtonComponent,
  AmountComponent,
  IconComponent,
  SkeletonComponent,
  CategoryBadgeComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  FormFieldComponent,
  CurrencyInputComponent,
  CategoryPickerComponent,
  SegmentedControlComponent,
  SegmentedControlOption,
  DialogShellComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    ButtonComponent,
    AmountComponent,
    IconComponent,
    SkeletonComponent,
    CategoryBadgeComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    CategoryPickerComponent,
    SegmentedControlComponent,
    DialogShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <ui-page-header
        [title]="ts.t()('recurring.title')"
        [subtitle]="ts.t()('recurring.subtitle')"
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
            <span>{{ ts.t()('recurring.new') }}</span>
          </button>
        </div>
      </ui-page-header>

      <!-- Loading State -->
      @if (state.isLoading() && state.recurringExpenses().length === 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div
              class="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between h-48 space-y-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <ui-skeleton shape="circle" customClass="w-10 h-10" />
                  <div class="space-y-1.5">
                    <ui-skeleton shape="line" customClass="h-4 w-28" />
                    <ui-skeleton shape="line" customClass="h-3 w-16" />
                  </div>
                </div>
                <ui-skeleton shape="line" customClass="h-6 w-14" />
              </div>
              <div class="flex justify-between items-end">
                <ui-skeleton shape="line" customClass="h-4 w-24" />
                <ui-skeleton shape="line" customClass="h-5 w-20" />
              </div>
            </div>
          }
        </div>
      } @else if (state.recurringExpenses().length === 0) {
        <!-- Empty State -->
        <ui-empty-state
          icon="replay"
          [title]="ts.t()('recurring.empty')"
          [description]="ts.t()('recurring.subtitle')"
        >
          <button
            uiButton
            variant="primary"
            uiEmptyAction
            type="button"
            (click)="openModal()"
          >
            <ui-icon name="add" size="sm" />
            <span>{{ ts.t()('recurring.create_now') }}</span>
          </button>
        </ui-empty-state>
      } @else {
        <!-- Recurring Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (expense of state.recurringExpenses(); track expense.id) {
            <div
              class="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm hover:border-accent/40 transition-colors"
            >
              <!-- Card Top Header -->
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <ui-category-badge
                      [name]="
                        ts.translateCategory(expense.category.name) || ts.t()('trans.general')
                      "
                      [icon]="expense.category.icons"
                      [color]="expense.category.color"
                      size="md"
                    />
                    <span
                      class="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-raised border border-border text-ink-muted uppercase tracking-wider shrink-0"
                    >
                      {{ getFrequencyLabel(expense.frequency) }}
                    </span>
                    @if (!expense.isActive) {
                      <span
                        class="text-[10px] font-bold text-expense bg-expense/10 px-2 py-0.5 rounded shrink-0"
                      >
                        {{ ts.t()('recurring.inactive') }}
                      </span>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      uiButton
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0"
                      (click)="openModal(expense)"
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
                      (click)="confirmDelete(expense)"
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

                <h3 class="font-bold text-ink text-base truncate mb-1" [title]="expense.description">
                  {{ expense.description }}
                </h3>
              </div>

              <!-- Next Execution & Amount -->
              <div class="flex justify-between items-end pt-4 mt-3 border-t border-border">
                <div>
                  <p class="text-[11px] text-ink-muted font-medium">
                    {{ ts.t()('recurring.next_payment') }}
                  </p>
                  <p class="text-xs sm:text-sm font-semibold text-ink tabular-nums">
                    {{ expense.nextExecutionDate | date: 'mediumDate' }}
                  </p>
                </div>
                <ui-amount [value]="expense.amount" tone="expense" size="md" />
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
            [title]="editingId() ? ts.t()('recurring.edit_title') : ts.t()('recurring.new_title')"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeModal()"
          >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- Description -->
              <ui-form-field [label]="ts.t()('trans.desc')" fieldId="rec-desc">
                <input
                  id="rec-desc"
                  type="text"
                  formControlName="description"
                  placeholder="e.g. Netflix, Rent, Spotify, Gym"
                  class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                />
              </ui-form-field>

              <!-- Amount -->
              <ui-form-field [label]="ts.t()('trans.amount')" fieldId="rec-amount">
                <ui-currency-input inputId="rec-amount" formControlName="amount" />
              </ui-form-field>

              <!-- Category Picker -->
              <ui-form-field [label]="ts.t()('trans.category')" fieldId="rec-category">
                <ui-category-picker
                  [categories]="categories()"
                  [placeholder]="ts.t()('trans.select_category')"
                  formControlName="categoryId"
                />
              </ui-form-field>

              <!-- Frequency Selector -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {{ ts.t()('recurring.freq') }}
                </label>
                <ui-segmented-control
                  [options]="frequencyOptions()"
                  formControlName="frequency"
                />
              </div>

              <!-- Day of Month (if MONTHLY) -->
              @if (form.get('frequency')?.value === 'MONTHLY') {
                <ui-form-field [label]="ts.t()('recurring.day_month')" fieldId="rec-day-month">
                  <input
                    id="rec-day-month"
                    type="number"
                    min="1"
                    max="31"
                    formControlName="dayOfMonth"
                    class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                  />
                </ui-form-field>
              }

              <!-- Day of Week (if WEEKLY) -->
              @if (form.get('frequency')?.value === 'WEEKLY') {
                <ui-form-field [label]="ts.t()('recurring.day_week')" fieldId="rec-day-week">
                  <select
                    id="rec-day-week"
                    formControlName="dayOfWeek"
                    class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                  >
                    @for (day of weekdayOptions(); track day.value) {
                      <option [ngValue]="day.value">{{ day.label }}</option>
                    }
                  </select>
                </ui-form-field>
              }

              <!-- Duration Mode (Indefinite vs Fixed) -->
              <div class="space-y-2 pt-1 border-t border-border">
                <label class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {{ ts.t()('recurring.duration') }}
                </label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="setDurationMode('indefinite')"
                    uiButton
                    [variant]="durationMode() === 'indefinite' ? 'primary' : 'secondary'"
                    size="sm"
                    class="flex-1"
                  >
                    {{ ts.t()('recurring.indefinite') }}
                  </button>
                  <button
                    type="button"
                    (click)="setDurationMode('fixed')"
                    uiButton
                    [variant]="durationMode() === 'fixed' ? 'primary' : 'secondary'"
                    size="sm"
                    class="flex-1"
                  >
                    {{ ts.t()('recurring.fixed') }}
                  </button>
                </div>

                @if (durationMode() === 'fixed') {
                  <ui-form-field
                    [label]="ts.t()('recurring.how_many')"
                    fieldId="rec-occurrences"
                  >
                    <div class="relative">
                      <input
                        id="rec-occurrences"
                        type="number"
                        min="1"
                        formControlName="totalOccurrences"
                        placeholder="e.g. 12"
                        class="w-full h-10 pl-3 pr-16 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                      />
                      <span class="absolute right-3 top-2.5 text-xs font-semibold text-ink-muted pointer-events-none">
                        {{ ts.t()('recurring.times') }}
                      </span>
                    </div>
                  </ui-form-field>
                }
              </div>

              <!-- Dialog Footer Buttons -->
              <div uiDialogFooter class="flex items-center justify-end gap-2.5">
                <button type="button" uiButton variant="secondary" (click)="closeModal()">
                  {{ ts.t()('trans.cancel') }}
                </button>
                <button
                  type="submit"
                  uiButton
                  variant="primary"
                  [disabled]="
                    form.invalid ||
                    (durationMode() === 'fixed' && !form.get('totalOccurrences')?.value)
                  "
                >
                  {{ editingId() ? ts.t()('recurring.update_btn') : ts.t()('recurring.create_btn') }}
                </button>
              </div>
            </form>
          </ui-dialog-shell>
        </div>
      </div>
    }
  `,
})
export class RecurringComponent implements OnInit {
  state = inject(RecurringStateService);
  ns = inject(NotificationService);
  api = inject(ApiService);
  dialogService = inject(UiDialogService);
  fb = inject(FormBuilder);
  ts = inject(TranslationService);

  showModal = signal(false);
  editingId = signal<number | null>(null);
  durationMode = signal<'indefinite' | 'fixed'>('indefinite');

  categories = signal<Category[]>([]);
  form: FormGroup;

  frequencyOptions = computed<SegmentedControlOption<string>[]>(() => [
    { value: 'DAILY', label: this.ts.t()('recurring.freq_daily') },
    { value: 'WEEKLY', label: this.ts.t()('recurring.freq_weekly') },
    { value: 'MONTHLY', label: this.ts.t()('recurring.freq_monthly') },
    { value: 'YEARLY', label: this.ts.t()('recurring.freq_yearly') },
  ]);

  weekdayOptions = computed(() => [
    { value: 1, label: this.ts.t()('weekdays.mon') },
    { value: 2, label: this.ts.t()('weekdays.tue') },
    { value: 3, label: this.ts.t()('weekdays.wed') },
    { value: 4, label: this.ts.t()('weekdays.thu') },
    { value: 5, label: this.ts.t()('weekdays.fri') },
    { value: 6, label: this.ts.t()('weekdays.sat') },
    { value: 7, label: this.ts.t()('weekdays.sun') },
  ]);

  constructor() {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: [null as number | null, Validators.required],
      frequency: ['MONTHLY', Validators.required],
      dayOfMonth: [new Date().getDate(), [Validators.min(1), Validators.max(31)]],
      dayOfWeek: [1],
      totalOccurrences: [null as number | null],
      currency: ['DOP'],
    });
  }

  ngOnInit() {
    this.api.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error loading categories', err),
    });
  }

  getFrequencyLabel(freq: string): string {
    switch (freq) {
      case 'DAILY':
        return this.ts.t()('recurring.freq_daily');
      case 'WEEKLY':
        return this.ts.t()('recurring.freq_weekly');
      case 'MONTHLY':
        return this.ts.t()('recurring.freq_monthly');
      case 'YEARLY':
        return this.ts.t()('recurring.freq_yearly');
      default:
        return freq;
    }
  }

  getSelectedCategory(): Category | undefined {
    const id = this.form.get('categoryId')?.value;
    return this.categories().find((c) => c.id === id);
  }

  openModal(expense: RecurringExpense | null = null) {
    if (expense) {
      this.editingId.set(expense.id);
      this.durationMode.set(expense.totalOccurrences ? 'fixed' : 'indefinite');

      this.form.patchValue({
        description: expense.description,
        amount: expense.amount,
        categoryId: expense.category.id,
        frequency: expense.frequency,
        dayOfMonth: expense.dayOfMonth || new Date().getDate(),
        dayOfWeek: expense.dayOfWeek || 1,
        totalOccurrences: expense.totalOccurrences || null,
        currency: 'DOP',
      });
    } else {
      this.editingId.set(null);
      this.durationMode.set('indefinite');
      this.form.reset({
        description: '',
        amount: 0,
        categoryId: null,
        frequency: 'MONTHLY',
        dayOfMonth: new Date().getDate(),
        dayOfWeek: 1,
        totalOccurrences: null,
        currency: 'DOP',
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  setDurationMode(mode: 'indefinite' | 'fixed') {
    this.durationMode.set(mode);
    if (mode === 'indefinite') {
      this.form.patchValue({ totalOccurrences: null });
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    const formData = this.form.value;
    if (this.durationMode() === 'indefinite') {
      formData.totalOccurrences = undefined;
    }

    const dto: CreateRecurringExpenseDto = {
      description: formData.description,
      amount: Number(formData.amount),
      categoryId: Number(formData.categoryId),
      frequency: formData.frequency,
      dayOfMonth: formData.dayOfMonth ? Number(formData.dayOfMonth) : undefined,
      dayOfWeek: formData.dayOfWeek ? Number(formData.dayOfWeek) : undefined,
      totalOccurrences: formData.totalOccurrences ? Number(formData.totalOccurrences) : undefined,
      currency: 'DOP',
    };

    // Optimistic close
    this.closeModal();

    try {
      if (this.editingId()) {
        const id = this.editingId()!;
        await this.state.update(id, dto);
        this.ns.show('recurring.updated', 'success');
      } else {
        const selectedCat = this.getSelectedCategory();
        await this.state.add(dto, selectedCat);
        this.ns.show('recurring.created', 'success');
      }
    } catch (err: any) {
      this.ns.show(err.error?.message || 'recurring.fail', 'error');
    }
  }

  async confirmDelete(expense: RecurringExpense) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('recurring.delete_title'),
      message: `${this.ts.t()('recurring.delete_confirm')} "${expense.description}"?`,
      confirmLabel: this.ts.t()('trans.delete'),
      cancelLabel: this.ts.t()('trans.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      try {
        await this.state.delete(expense.id);
        this.ns.show('recurring.deleted', 'success');
      } catch (err) {
        this.ns.show('recurring.fail', 'error');
      }
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
