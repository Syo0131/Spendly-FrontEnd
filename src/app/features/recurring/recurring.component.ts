import { Component, inject, signal, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common'; // Explicit imports
import { RecurringStateService } from '../../core/services/recurring-state.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import {
  RecurringExpense,
  CreateRecurringExpenseDto,
  Category,
} from '../../core/models/api.models';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CategoryIconPipe } from '../../shared/icons/category-icon.pipe';
import { UiCardComponent } from '../../shared/components/ui/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui/ui-button.component';
import { UiEmptyStateComponent } from '../../shared/components/ui/ui-empty-state.component';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CurrencyInputDirective,
    DatePipe,
    DecimalPipe,
    NgClass,
    IconComponent,
    CategoryIconPipe,
    UiCardComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 pb-24 md:pb-6 space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-display font-semibold text-content tracking-tight">
            {{ ts.t()('recurring.title') }}
          </h1>
          <p class="text-sm text-content-muted mt-1 font-medium">
            {{ ts.t()('recurring.subtitle') }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-primary hover:bg-primary-dark text-primary-on rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 font-semibold text-sm md:text-base tracking-wide"
        >
          <app-icon name="add_circle" [size]="20" class="mr-2" />
          {{ ts.t()('recurring.new') }}
        </button>
      </div>

      <!-- Loading State -->
      @if (state.isLoading() && state.recurringExpenses().length === 0) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
        <div class="p-5 border border-divider rounded-2xl bg-white/5">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-surface-3"></div>
              <div class="space-y-2">
                <div class="h-4 w-32 bg-surface-3 rounded"></div>
                <div class="h-3 w-16 bg-surface-3 rounded"></div>
              </div>
            </div>
          </div>
          <div class="flex justify-between items-end mt-4">
            <div class="h-6 w-24 bg-surface-3 rounded"></div>
          </div>
        </div>
        }
      </div>
      }

      <!-- Empty State -->
      @if (!state.isLoading() && state.recurringExpenses().length === 0) {
      <ui-card [padded]="false">
        <ui-empty-state icon="replay" [title]="ts.t()('recurring.empty')">
          <ui-button (click)="openModal()">
            <app-icon name="add_circle" [size]="18" />
            {{ ts.t()('recurring.create_now') }}
          </ui-button>
        </ui-empty-state>
      </ui-card>
      }

      <!-- Grid -->
      @if (state.recurringExpenses().length > 0) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (expense of state.recurringExpenses(); track expense.id) {
        <div
          class="glass-card p-5 border border-divider hover:shadow-xl hover:border-primary/20 transition-all duration-300 rounded-2xl bg-surface-2 group"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                [style.background-color]="expense.category.color + '20'"
              >
                <app-icon [name]="expense.category.name | categoryIcon: expense.category.icons" [size]="24" [style.color]="expense.category.color" />
              </div>
              <div>
                <h3 class="text-base font-bold text-content leading-tight mb-1">
                  {{ expense.description }}
                </h3>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold text-content-subtle uppercase tracking-wider bg-surface-3 px-2 py-0.5 rounded border border-divider"
                  >
                    {{ expense.frequency }}
                  </span>
                  @if (!expense.isActive) {
                  <span
                    class="text-[10px] font-bold text-expense bg-expense/12 px-2 py-0.5 rounded"
                    >{{ ts.t()('recurring.inactive') }}</span
                  >
                  }
                </div>
              </div>
            </div>

            <div
              class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                (click)="openModal(expense)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-content-subtle hover:text-primary hover:bg-primary/10 transition-all"
              >
                <app-icon name="edit" [size]="20" />
              </button>
              <button
                (click)="confirmDelete(expense)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-content-subtle hover:text-expense hover:bg-expense/10 transition-all"
              >
                <app-icon name="delete" [size]="20" />
              </button>
            </div>
          </div>

          <div class="flex justify-between items-end mt-4">
            <div>
              <p class="text-xs text-content-muted font-medium">
                {{ ts.t()('recurring.next_payment') }}
              </p>
              <p class="text-sm font-bold text-content">
                {{ expense.nextExecutionDate | date : 'mediumDate' }}
              </p>
            </div>
            <span class="text-xl font-bold text-content"
              >DOP {{ expense.amount | number : '1.2-2' }}</span
            >
          </div>
        </div>
        }
      </div>
      }
    </div>

    <!-- Edit/Create Modal (Inline) -->
    @defer (when showModal()) { @if (showModal()) {
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 px-4 sm:px-0 animate-fade-in"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
      <div
        class="glass-card w-full max-w-md p-6 relative bg-surface-2 border border-divider shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl animate-scale-in"
      >
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 text-content-subtle hover:text-content transition-colors p-2 hover:bg-surface-3 rounded-full"
        >
          <app-icon name="close" [size]="20" />
        </button>

        <div class="text-center mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <app-icon [name]="editingId() ? 'edit_calendar' : 'update'" [size]="30" class="text-primary" />
          </div>
          <h2 class="text-xl font-bold text-content">
            {{ editingId() ? ts.t()('recurring.edit_title') : ts.t()('recurring.new_title') }}
          </h2>
          <p class="text-content-muted text-xs mt-1">{{ ts.t()('recurring.modal_desc') }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Description -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.desc') }}
            </label>
            <input
              type="text"
              formControlName="description"
              placeholder="e.g. Netflix, Rent"
              class="w-full bg-surface-3 border border-divider text-content text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
            />
          </div>

          <!-- Amount -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.amount') }}
            </label>
            <div class="relative group">
              <span
                class="absolute left-4 top-3.5 text-content-muted font-bold text-lg"
                >$</span
              >
              <input
                type="text"
                inputmode="decimal"
                appCurrencyInput
                formControlName="amount"
                placeholder="0.00"
                class="w-full bg-surface-3 border border-divider text-content text-lg font-bold rounded-xl p-3 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
              />
            </div>
          </div>

          <!-- Category -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.category') }}
            </label>
            <div class="relative">
              <div
                (click)="toggleCategoryDropdown()"
                class="w-full bg-surface-3 border border-divider rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div class="flex items-center gap-2">
                  @if (getSelectedCategory(); as cat) {
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white"
                    [style.background-color]="cat.color"
                  >
                    <app-icon [name]="cat.name | categoryIcon: cat.icons" [size]="14" />
                  </div>
                  <span class="text-content font-bold text-sm">{{
                    ts.translateCategory(cat.name)
                  }}</span>
                  } @else {
                  <app-icon name="category" [size]="20" class="text-content-subtle" />
                  <span class="text-content-subtle text-sm font-medium">{{
                    ts.t()('trans.select_category')
                  }}</span>
                  }
                </div>
                <app-icon name="expand_more" [size]="20" class="text-content-subtle group-hover:text-primary transition-colors" />
              </div>

              <!-- Category Dropdown -->
              @if (showCategoryDropdown()) {
              <div
                class="absolute z-50 top-full left-0 right-0 mt-2 bg-surface-2 border border-divider rounded-xl shadow-xl max-h-52 overflow-y-auto custom-scrollbar animate-scale-in"
              >
                @for (cat of categories(); track cat.id) {
                <div
                  (click)="selectCategory(cat)"
                  class="p-2.5 flex items-center gap-2.5 hover:bg-surface-3 rounded-lg cursor-pointer transition-colors border-b border-divider dark:border-white/5 last:border-0"
                >
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <app-icon [name]="cat.name | categoryIcon: cat.icons" [size]="14" />
                  </div>
                  <span class="text-sm font-bold text-content">{{
                    ts.translateCategory(cat.name)
                  }}</span>
                </div>
                }
              </div>
              }
            </div>
          </div>

          <!-- Frequency Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >
                {{ ts.t()('recurring.freq') }}
              </label>
              <select
                formControlName="frequency"
                class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 cursor-pointer"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <!-- Day of Month -->
            @if (form.get('frequency')?.value === 'MONTHLY') {
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >
                {{ ts.t()('recurring.day_month') }}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                formControlName="dayOfMonth"
                class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            }

            <!-- Day of Week -->
            @if (form.get('frequency')?.value === 'WEEKLY') {
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >
                {{ ts.t()('recurring.day_week') }}
              </label>
              <select
                formControlName="dayOfWeek"
                class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 cursor-pointer"
              >
                <option [ngValue]="1">Monday</option>
                <option [ngValue]="2">Tuesday</option>
                <option [ngValue]="3">Wednesday</option>
                <option [ngValue]="4">Thursday</option>
                <option [ngValue]="5">Friday</option>
                <option [ngValue]="6">Saturday</option>
                <option [ngValue]="7">Sunday</option>
              </select>
            </div>
            }
          </div>

          <!-- Duration -->
          <div class="space-y-3 pt-2">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('recurring.duration') }}
            </label>
            <div class="flex bg-surface-3 p-1 rounded-xl">
              <button
                type="button"
                (click)="setDurationMode('indefinite')"
                class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                [ngClass]="
                  durationMode() === 'indefinite'
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                    : 'text-content-muted hover:text-content-muted'
                "
              >
                {{ ts.t()('recurring.indefinite') }}
              </button>
              <button
                type="button"
                (click)="setDurationMode('fixed')"
                class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                [ngClass]="
                  durationMode() === 'fixed'
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                    : 'text-content-muted hover:text-content-muted'
                "
              >
                {{ ts.t()('recurring.fixed') }}
              </button>
            </div>

            @if (durationMode() === 'fixed') {
            <div class="animate-fade-in space-y-1.5">
              <p class="text-[10px] text-content-subtle ml-1">
                {{ ts.t()('recurring.how_many') }}
              </p>
              <div class="relative">
                <input
                  type="number"
                  min="1"
                  formControlName="totalOccurrences"
                  placeholder="e.g. 12"
                  class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span class="absolute right-4 top-3.5 text-xs font-bold text-content-subtle">{{
                  ts.t()('recurring.times')
                }}</span>
              </div>
            </div>
            }
          </div>

          <button
            type="submit"
            [disabled]="
              form.invalid || (durationMode() === 'fixed' && !form.get('totalOccurrences')?.value)
            "
            class="w-full bg-primary hover:bg-primary-dark text-primary-on py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
          >
            <app-icon name="check" [size]="20" />
            {{ editingId() ? ts.t()('recurring.update_btn') : ts.t()('recurring.create_btn') }}
          </button>
        </form>
      </div>
    </div>
    } }

    <!-- Delete Modal -->
    @if (showDeleteModal()) {
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="cancelDelete()"></div>
      <div
        class="glass-card w-full max-w-sm p-6 text-center bg-surface-2 border border-divider shadow-2xl rounded-2xl relative animate-scale-in"
      >
        <div
          class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-3 text-expense"
        >
          <app-icon name="delete_forever" [size]="28" />
        </div>
        <h3 class="text-lg font-bold text-content mb-1">
          {{ ts.t()('recurring.delete_title') }}
        </h3>
        <p class="text-content-muted mb-6 text-sm leading-relaxed">
          {{ ts.t()('recurring.delete_confirm') }}
          <span class="font-bold text-content">{{
            expenseToDelete()?.description
          }}</span
          >? This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button
            (click)="cancelDelete()"
            class="flex-1 px-4 py-2.5 bg-surface-3 text-content-muted font-bold rounded-xl hover:bg-surface-3 transition-colors text-sm"
          >
            {{ ts.t()('trans.cancel') }}
          </button>
          <button
            (click)="performDelete()"
            class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] text-sm"
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
export class RecurringComponent implements OnInit {
  state = inject(RecurringStateService);
  ns = inject(NotificationService);
  api = inject(ApiService);
  fb = inject(FormBuilder);
  ts = inject(TranslationService);

  // UI Signals
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingId = signal<number | null>(null);
  expenseToDelete = signal<RecurringExpense | null>(null);

  // Custom Dropdown UI
  showCategoryDropdown = signal(false);
  durationMode = signal<'indefinite' | 'fixed'>('indefinite');

  // Data
  categories = signal<Category[]>([]);

  // Form
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: [null, Validators.required],
      frequency: ['MONTHLY', Validators.required],
      dayOfMonth: [new Date().getDate(), [Validators.min(1), Validators.max(31)]],
      dayOfWeek: [1],
      totalOccurrences: [null],
      currency: ['DOP'],
    });
  }

  ngOnInit() {
    // Resource loads automatically on read, or we can trigger fetch if not lazy
    // With rxResource, reading state.recurringExpenses() in template triggers load.
    // But we might want initial load or prefetch.
    // However, the service logic might not expose refresh() as public without a parameter if we changed it.
    // Let's check service again. Service exposes refresh().
    // Also, we need to load categories.
    this.api.getCategories().subscribe((cats) => this.categories.set(cats));
  }

  // --- Modal Logic ---

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
    this.showCategoryDropdown.set(false);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  // --- Form Helper Logic ---

  getSelectedCategory() {
    const id = this.form.get('categoryId')?.value;
    return this.categories().find((c) => c.id === id);
  }

  toggleCategoryDropdown() {
    this.showCategoryDropdown.update((v) => !v);
  }

  selectCategory(cat: Category) {
    this.form.patchValue({ categoryId: cat.id });
    this.showCategoryDropdown.set(false);
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
      amount: formData.amount,
      categoryId: formData.categoryId,
      frequency: formData.frequency,
      dayOfMonth: formData.dayOfMonth,
      dayOfWeek: formData.dayOfWeek,
      totalOccurrences: formData.totalOccurrences,
      currency: 'DOP',
    };

    try {
      if (this.editingId()) {
        // Update
        const id = this.editingId()!;
        this.state.update(id, dto).then(() => {
          this.ns.show(this.ts.translate('recurring.updated'), 'success');
          this.closeModal();
        });
      } else {
        // Create
        // Optimistic UI: Pass the selected category object
        const selectedCat = this.getSelectedCategory();

        this.state.add(dto, selectedCat).then(() => {
          this.ns.show(this.ts.translate('recurring.created'), 'success');
          this.closeModal();
        });
      }
    } catch (err: any) {
      this.ns.show(err.error?.message || this.ts.translate('recurring.fail'), 'error');
    }
  }

  // --- Deletion Logic ---

  confirmDelete(expense: RecurringExpense) {
    this.expenseToDelete.set(expense);
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.expenseToDelete.set(null);
  }

  async performDelete() {
    const expense = this.expenseToDelete();
    if (!expense) return;

    // Optimistic Close
    this.cancelDelete();

    try {
      await this.state.delete(expense.id);
      this.ns.show(this.ts.translate('recurring.deleted'), 'success');
    } catch (err) {
      this.ns.show(this.ts.translate('recurring.fail'), 'error');
    }
  }
}
