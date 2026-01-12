import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RecurringStateService } from '../../core/services/recurring-state.service';
import { RecurringFormComponent } from './recurring-form.component';
import { CreateRecurringExpenseDto, RecurringExpense } from '../../core/models/api.models';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, RecurringFormComponent, DatePipe],
  template: `
    <div class="p-6 pb-24 md:pb-6 space-y-6 animate-fade-in-up">
      <!-- Header -->
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Recurring Expenses
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage your automated subscriptions and bills
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full md:w-auto px-4 py-3 md:py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 font-semibold text-sm tracking-wide"
        >
          <span class="material-icons-outlined mr-2 text-lg">add_circle</span>
          New
        </button>
      </div>

      <!-- Loading State -->
      <div
        *ngIf="state.isLoading() && state.recurringExpenses().length === 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse"
      >
        <div
          *ngFor="let i of [1, 2, 3]"
          class="h-48 bg-white/5 border border-white/5 rounded-2xl"
        ></div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!state.isLoading() && state.recurringExpenses().length === 0"
        class="glass-card p-12 text-center border border-gray-200 dark:border-white/10 rounded-2xl"
      >
        <div
          class="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600"
            >replay</span
          >
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">No recurring expenses</h3>
        <button
          (click)="openModal()"
          class="text-primary hover:text-primary-light font-bold text-sm"
        >
          Create one now
        </button>
      </div>

      <!-- Grid -->
      <div
        *ngIf="state.recurringExpenses().length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div
          *ngFor="let expense of state.recurringExpenses()"
          class="glass-card p-5 border border-gray-100 dark:border-white/5 hover:shadow-xl hover:border-primary/20 transition-all duration-300 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 group"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                [style.background-color]="expense.category.color + '20'"
              >
                <span
                  class="material-icons-outlined text-xl"
                  [style.color]="expense.category.color"
                  >{{ expense.category.icons }}</span
                >
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">
                  {{ expense.description }}
                </h3>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/5"
                  >
                    {{ expense.frequency }}
                  </span>
                  <span
                    *ngIf="!expense.isActive"
                    class="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded"
                    >INACTIVE</span
                  >
                </div>
              </div>
            </div>

            <button
              (click)="state.delete(expense.id)"
              class="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <span class="material-icons-outlined text-lg">delete</span>
            </button>
          </div>

          <div class="flex justify-between items-end mt-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Next payment</p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ expense.nextExecutionDate | date : 'mediumDate' }}
              </p>
            </div>
            <span class="text-xl font-bold text-gray-900 dark:text-white"
              >DOP {{ expense.amount | number : '1.2-2' }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <app-recurring-form
      *ngIf="showModal"
      [expense]="selectedExpense"
      (save)="onSave($event)"
      (cancel)="closeModal()"
    ></app-recurring-form>
  `,
})
export class RecurringComponent implements OnInit {
  state = inject(RecurringStateService);
  ts = inject(TranslationService);

  showModal = false;
  selectedExpense: RecurringExpense | null = null;

  ngOnInit() {
    this.state.load(0, 50); // Load initial data
  }

  openModal(expense: RecurringExpense | null = null) {
    this.selectedExpense = expense;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedExpense = null;
  }

  onSave(dto: CreateRecurringExpenseDto) {
    if (this.selectedExpense) {
      // Update logic would go here if we implemented full update form support
      // For now, we mainly support creation as per requirements, but update is easy to add
      this.state
        .update(this.selectedExpense.id, {
          description: dto.description,
          amount: dto.amount,
          isActive: true,
        })
        .subscribe(() => this.closeModal());
    } else {
      this.state.add(dto).subscribe(() => this.closeModal());
    }
  }
}
