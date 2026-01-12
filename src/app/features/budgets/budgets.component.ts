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
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { NotificationService } from '../../core/services/notification.service';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyInputDirective, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 pb-24 md:pb-6 space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ ts.t()('budgets.title') || 'Budgets' }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Control your expenses and save more
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <!-- Month Navigation -->
          <div
            class="flex items-center justify-between bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 shadow-sm flex-1 md:flex-none"
          >
            <button
              (click)="prevMonth()"
              class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors active:scale-95"
            >
              <span class="material-icons-outlined text-lg">chevron_left</span>
            </button>
            <div
              class="px-3 font-bold text-sm text-gray-900 dark:text-white min-w-[120px] text-center select-none uppercase tracking-wide cursor-default"
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
            class="px-4 py-3 sm:py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 font-semibold text-sm tracking-wide md:w-auto"
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

            <!-- Action Buttons -->
            <div
              class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                (click)="openModal(budget)"
                class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <span class="material-icons-outlined text-base">edit</span>
              </button>
              <button
                (click)="confirmDelete(budget)"
                class="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <span class="material-icons-outlined text-base">delete_outline</span>
              </button>
            </div>
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
      *ngIf="showModal()"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 px-4 sm:px-0"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
      <div
        class="glass-card w-full max-w-md p-6 relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl animate-scale-in"
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
            {{ selectedBudget() ? 'Edit Budget' : ts.t()('budgets.add') || 'New Budget' }}
          </h2>
          <p class="text-gray-500 text-xs mt-1">
            Set limits to your spending for {{ currentDate() | date : 'MMMM' }}
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
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
                formControlName="limit"
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
                      form.get('period')?.value | titlecase
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
                      >{{ form.get('warningThreshold')?.value }}%</span
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
                      >{{ form.get('criticalThreshold')?.value }}%</span
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
              (click)="toggleRecurring()"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-white/5"
                >
                  <span class="material-icons-outlined text-lg">loop</span>
                </div>
              </div>
              <!-- Recurring Toggle -->
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-200 mr-2"
                  >Recurring Budget</span
                >
                <button
                  type="button"
                  (click)="toggleRecurring(); $event.stopPropagation()"
                  class="relative w-11 h-6 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  [ngClass]="
                    form.get('isRecurring')?.value ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-700'
                  "
                >
                  <span
                    class="inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-sm"
                    [ngClass]="
                      form.get('isRecurring')?.value
                        ? 'translate-x-full border-white'
                        : 'translate-x-1 border-gray-100'
                    "
                  ></span>
                </button>
              </div>
            </div>

            <!-- Recurring Settings -->
            <div *ngIf="form.get('isRecurring')?.value" class="space-y-3 animate-fade-in pl-1 mt-2">
              <label
                class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Number of Periods</label
              >
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  *ngFor="let r of repeatOptions"
                  (click)="selectRepeat(r)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                  [ngClass]="
                    form.get('numberOfPeriods')?.value === r
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-primary/50'
                  "
                >
                  {{ r }} Months
                </button>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting()"
            class="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
          >
            <span
              *ngIf="isSubmitting()"
              class="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
            ></span>
            {{ isSubmitting() ? 'Saving...' : ts.t()('trans.save') || 'Save Budget' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      *ngIf="showDeleteModal()"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        class="glass-card w-full max-w-sm p-6 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl animate-scale-in"
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
            budgetToDelete()?.category?.name
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
  showDeleteModal = signal(false);
  budgetToDelete = signal<Budget | null>(null);
  selectedBudget = signal<Budget | null>(null);

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

  selectAlert(val: number) {
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

      this.state.updateBudget(this.selectedBudget()!.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.ns.show('Budget updated successfully', 'success');
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.ns.show(err.error?.message || 'Failed to update budget', 'error');
        },
      });
    } else {
      this.state.addBudget(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
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

    this.state.removeBudget(budget.id).subscribe({
      next: () => {
        this.ns.show('Budget deleted', 'success');
        this.cancelDelete();
      },
      error: () => this.ns.show('Failed to delete budget', 'error'),
    });
  }
}
