import { Component, EventEmitter, Input, Output, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import {
  CreateRecurringExpenseDto,
  RecurringExpense,
  Frequency,
  Category,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

@Component({
  selector: 'app-recurring-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInputDirective],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 px-4 sm:px-0">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="onCancel()"></div>
      <div
        class="glass-card w-full max-w-md p-6 relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl animate-scale-in"
      >
        <!-- Close Button -->
        <button
          (click)="onCancel()"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
        >
          <span class="material-icons-outlined text-lg">close</span>
        </button>

        <!-- Header -->
        <div class="text-center mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-primary">{{
              isEdit ? 'edit_calendar' : 'update'
            }}</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ isEdit ? 'Edit Recurring Expense' : 'New Recurring Expense' }}
          </h2>
          <p class="text-gray-500 text-xs mt-1">Automate your regular payments</p>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-4">
          <!-- Description -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
              >Description</label
            >
            <input
              type="text"
              [(ngModel)]="formData.description"
              name="description"
              required
              placeholder="e.g. Netflix, Rent"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
            />
          </div>

          <!-- Amount -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
              >Amount</label
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
                [(ngModel)]="formData.amount"
                name="amount"
                required
                placeholder="0.00"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-lg font-bold rounded-xl p-3 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
              />
            </div>
          </div>

          <!-- Category -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
              >Category</label
            >
            <div class="relative">
              <div
                (click)="showCategoryDropdown = !showCategoryDropdown"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all"
              >
                <div class="flex items-center gap-2">
                  <ng-container *ngIf="getSelectedCategory() as cat; else placeholder">
                    <div
                      class="w-6 h-6 rounded-md flex items-center justify-center text-white"
                      [style.background-color]="cat.color"
                    >
                      <span class="material-icons-outlined text-xs">{{ cat.icons }}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{
                      cat.name
                    }}</span>
                  </ng-container>
                  <ng-template #placeholder>
                    <span class="text-gray-400 text-sm font-medium">Select Category</span>
                  </ng-template>
                </div>
                <span class="material-icons-outlined text-gray-400">expand_more</span>
              </div>

              <!-- Dropdown -->
              <div
                *ngIf="showCategoryDropdown"
                class="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1"
              >
                <div
                  *ngFor="let cat of categories()"
                  (click)="selectCategory(cat)"
                  class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <span class="material-icons-outlined text-sm">{{ cat.icons }}</span>
                  </div>
                  <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{
                    cat.name
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Frequency Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Frequency</label
              >
              <select
                [(ngModel)]="formData.frequency"
                name="frequency"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl p-3 cursor-pointer"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY" selected>Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <!-- Day of Month (for Monthly) -->
            <div class="space-y-1.5" *ngIf="formData.frequency === 'MONTHLY'">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Day of Month</label
              >
              <input
                type="number"
                min="1"
                max="31"
                [(ngModel)]="formData.dayOfMonth"
                name="dayOfMonth"
                required
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <!-- Day of Week (for Weekly) -->
            <div class="space-y-1.5" *ngIf="formData.frequency === 'WEEKLY'">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Day of Week</label
              >
              <select
                [(ngModel)]="formData.dayOfWeek"
                name="dayOfWeek"
                required
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl p-3 cursor-pointer"
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
          </div>

          <!-- Total Occurrences (Optional) -->
          <div class="space-y-1.5">
            <div class="flex justify-between">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >End After (Optional)</label
              >
              <span class="text-[10px] text-gray-400">{{
                formData.totalOccurrences ? formData.totalOccurrences + ' times' : 'Indefinite'
              }}</span>
            </div>
            <input
              type="number"
              min="1"
              [(ngModel)]="formData.totalOccurrences"
              name="totalOccurrences"
              placeholder="Leave empty for indefinite"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              (click)="onCancel()"
              class="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl font-bold transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="!form.valid || !formData.categoryId"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isEdit ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-scale-in {
        animation: scaleIn 0.2s ease-out;
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
    `,
  ],
})
export class RecurringFormComponent {
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
    }
  }

  @Output() save = new EventEmitter<CreateRecurringExpenseDto>();
  @Output() cancel = new EventEmitter<void>();

  api = inject(ApiService);
  ts = inject(TranslationService);

  categories = signal<Category[]>([]);
  showCategoryDropdown = false;
  isEdit = false;

  formData: CreateRecurringExpenseDto = {
    description: '',
    amount: 0,
    categoryId: 0,
    frequency: 'MONTHLY',
    dayOfMonth: new Date().getDate(),
    currency: 'DOP',
  };

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.api.getCategories().subscribe((res) => this.categories.set(res));
  }

  getSelectedCategory() {
    return this.categories().find((c) => c.id === this.formData.categoryId);
  }

  selectCategory(cat: Category) {
    this.formData.categoryId = cat.id;
    this.showCategoryDropdown = false;
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    this.save.emit(this.formData);
  }
}
