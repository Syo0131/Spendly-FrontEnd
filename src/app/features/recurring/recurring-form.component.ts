import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import {
  CreateRecurringExpenseDto,
  RecurringExpense,
  Category,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CategoryIconPipe } from '../../shared/icons/category-icon.pipe';

@Component({
  selector: 'app-recurring-form',
  standalone: true,
  imports: [FormsModule, CurrencyInputDirective, IconComponent, CategoryIconPipe],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 px-4 sm:px-0">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="onCancel()"></div>
      <div
        class="glass-card w-full max-w-md p-6 relative bg-surface-2 border border-divider shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl animate-scale-in"
      >
        <!-- Close Button -->
        <button
          (click)="onCancel()"
          class="absolute top-4 right-4 text-content-subtle hover:text-content transition-colors p-2 hover:bg-surface-3 rounded-full"
        >
          <app-icon name="close" [size]="20" />
        </button>

        <!-- Header -->
        <div class="text-center mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <app-icon [name]="isEdit ? 'edit_calendar' : 'update'" [size]="30" class="text-primary" />
          </div>
          <h2 class="text-xl font-bold text-content">
            {{ isEdit ? 'Edit Recurring Expense' : 'New Recurring Expense' }}
          </h2>
          <p class="text-content-muted text-xs mt-1">Automate your regular payments</p>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-5">
          <!-- Description -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >Description</label
            >
            <input
              type="text"
              [(ngModel)]="formData.description"
              name="description"
              required
              placeholder="e.g. Netflix, Rent"
              class="w-full bg-surface-3 border border-divider text-content text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
            />
          </div>

          <!-- Amount -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >Amount</label
            >
            <div class="relative group">
              <span
                class="absolute left-4 top-3.5 text-content-muted font-bold text-lg"
                >$</span
              >
              <input
                type="text"
                inputmode="decimal"
                appCurrencyInput
                [(ngModel)]="formData.amount"
                name="amount"
                required
                placeholder="0.00"
                class="w-full bg-surface-3 border border-divider text-content text-lg font-bold rounded-xl p-3 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
              />
            </div>
          </div>

          <!-- Category -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >Category</label
            >
            <div class="relative">
              <button
                type="button"
                (click)="showCategoryDropdown = !showCategoryDropdown"
                class="w-full flex items-center justify-between p-3 bg-surface-3 rounded-xl border border-divider text-left transition-colors hover:border-primary/50"
              >
                <div class="flex items-center gap-2">
                  @if (getSelectedCategory(); as cat) {
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <app-icon [name]="cat.name | categoryIcon: cat.icons" [size]="14" />
                  </div>
                  <span class="text-content font-medium">{{
                    ts.translateCategory(cat.name)
                  }}</span>
                  } @else {
                  <span class="text-content-subtle text-sm font-medium">Select Category</span>
                  }
                </div>
                <app-icon name="expand_more" [size]="24" class="text-content-subtle" />
              </button>

              <!-- Dropdown -->
              @if (showCategoryDropdown) {
              <div
                class="absolute z-50 top-full left-0 right-0 mt-2 bg-surface-2 border border-divider rounded-xl shadow-xl max-h-52 overflow-y-auto no-scrollbar animate-scale-in"
              >
                @for (cat of categories; track cat.id) {
                <button
                  type="button"
                  (click)="selectCategory(cat)"
                  class="w-full flex items-center gap-2.5 p-2.5 hover:bg-surface-3 transition-colors border-b border-divider last:border-0"
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
                </button>
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
                >Frequency</label
              >
              <select
                [(ngModel)]="formData.frequency"
                name="frequency"
                class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 cursor-pointer"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY" selected>Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <!-- Day of Month (for Monthly) -->
            @if (formData.frequency === 'MONTHLY') {
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
                >Day of Month</label
              >
              <input
                type="number"
                min="1"
                max="31"
                [(ngModel)]="formData.dayOfMonth"
                name="dayOfMonth"
                required
                class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            }

            <!-- Day of Week (for Weekly) -->
            @if (formData.frequency === 'WEEKLY') {
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
                >Day of Week</label
              >
              <select
                [(ngModel)]="formData.dayOfWeek"
                name="dayOfWeek"
                required
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

          <!-- Duration / End After -->
          <div class="space-y-3 pt-2">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
              >Duration</label
            >

            <!-- Toggle -->
            <div class="flex bg-surface-3 p-1 rounded-xl">
              <button
                type="button"
                (click)="durationMode = 'indefinite'; formData.totalOccurrences = undefined"
                class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                [class]="
                  durationMode === 'indefinite'
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                    : 'text-content-muted hover:text-content-muted'
                "
              >
                Indefinite
              </button>
              <button
                type="button"
                (click)="durationMode = 'fixed'"
                class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                [class]="
                  durationMode === 'fixed'
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                    : 'text-content-muted hover:text-content-muted'
                "
              >
                Set End Date
              </button>
            </div>

            <!-- Input for Fixed -->
            @if (durationMode === 'fixed') {
            <div class="animate-fade-in space-y-1.5">
              <p class="text-[10px] text-content-subtle ml-1">
                How many times should this expense occur?
              </p>
              <div class="relative">
                <input
                  type="number"
                  min="1"
                  [(ngModel)]="formData.totalOccurrences"
                  name="totalOccurrences"
                  placeholder="e.g. 12"
                  required
                  class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span class="absolute right-4 top-3.5 text-xs font-bold text-content-subtle">Times</span>
              </div>
            </div>
            }
          </div>

          <!-- Actions -->
          <button
            type="submit"
            [disabled]="
              !form.valid ||
              !formData.categoryId ||
              (durationMode === 'fixed' && !formData.totalOccurrences)
            "
            class="w-full bg-primary hover:bg-primary-dark text-primary-on py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
          >
            <app-icon name="check" [size]="20" />
            {{ isEdit ? 'Update Expense' : 'Create Recurring Expense' }}
          </button>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .animate-scale-in {
        animation: scaleIn 0.2s ease-out;
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
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
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class RecurringFormComponent {
  @Input() categories: Category[] = [];
  @Input() set expense(value: RecurringExpense | null) {
    if (value) {
      this.isEdit = true;
      this.formData = {
        description: value.description,
        amount: value.amount,
        categoryId: value.category.id, // Using category.id for the DTO
        frequency: value.frequency,
        dayOfMonth: value.dayOfMonth,
        dayOfWeek: value.dayOfWeek,
        totalOccurrences: value.totalOccurrences,
      };

      // Initialize mode logic
      if (value.totalOccurrences && value.totalOccurrences > 0) {
        this.durationMode = 'fixed';
      } else {
        this.durationMode = 'indefinite';
      }
    }
  }

  @Output() save = new EventEmitter<CreateRecurringExpenseDto>();
  @Output() cancel = new EventEmitter<void>();

  api = inject(ApiService);
  ts = inject(TranslationService);

  showCategoryDropdown = false;
  isEdit = false;
  durationMode: 'indefinite' | 'fixed' = 'indefinite';

  formData: CreateRecurringExpenseDto = {
    description: '',
    amount: 0,
    categoryId: 0,
    frequency: 'MONTHLY',
    dayOfMonth: new Date().getDate(),
    currency: 'DOP',
  };

  constructor() {}

  getSelectedCategory() {
    return this.categories.find((c) => c.id === this.formData.categoryId);
  }

  selectCategory(cat: Category) {
    this.formData.categoryId = cat.id;
    this.showCategoryDropdown = false;
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    // Final check to clear totalOccurrences if indefinite
    if (this.durationMode === 'indefinite') {
      this.formData.totalOccurrences = undefined;
    }
    // We need to pass the category object for optimistic UI, but 'save' emits DTO.
    // The parent component handles the service call. We should check parent.
    // However, DTO doesn't have the category object.
    // If the parent uses 'formData' directly, it only sees the DTO.

    // Actually, 'save' is an EventEmitter<CreateRecurringExpenseDto>.
    // To support optimistic UI passing the category, we might need to emit more info
    // or rely on the parent to look it up.
    // But since this component KNOWS the selected category, it's best if it could pass it.
    // Let's see how the parent handles it.
    this.save.emit(this.formData);
  }
}
