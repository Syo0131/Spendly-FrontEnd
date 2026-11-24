import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  HostListener,
  inject,
  computed,
} from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ExpenseStateService } from '../../core/services/expense-state.service';
import { ExpenseResponse, Category } from '../../core/models/api.models';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CurrencyInputDirective, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('nav.expenses') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">Track your spending habits</p>
        </div>

        <!-- Right Actions: Filter & Add -->
        <!-- Filter Dropdown -->
        <div class="flex items-center gap-2">
          <!-- Date Filter -->
          <div class="relative">
            <button
              (click)="toggleMonthPicker()"
              class="px-2 py-1.5 md:px-4 md:py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <span class="material-icons-outlined text-gray-500 dark:text-gray-400"
                >calendar_today</span
              >
              <span>{{ getDateFilterLabel() }}</span>
              <span class="material-icons-outlined text-sm">expand_more</span>
            </button>

            @if (isMonthPickerOpen()) {
            <div
              class="absolute z-40 top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-scale-in"
            >
              <div class="py-2">
                <button
                  (click)="selectMonth(null, null)"
                  class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                  [class.text-primary]="!currentDateFilter()"
                >
                  All Time
                </button>
                @for (m of getAvailableMonths(); track m.label) {
                <button
                  (click)="selectMonth(m.month, m.year)"
                  class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  [class.text-primary]="
                    currentDateFilter()?.month === m.month && currentDateFilter()?.year === m.year
                  "
                >
                  {{ m.label }}
                </button>
                }
              </div>
            </div>
            }
          </div>

          <!-- Category Filter -->
          <div class="relative">
            <button
              (click)="toggleFilterDropdown()"
              class="px-2 py-1.5 md:px-4 md:py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <span class="material-icons-outlined text-gray-500 dark:text-gray-400"
                >filter_list</span
              >
              <span>{{ getFilterLabel() }}</span>
              <span class="material-icons-outlined text-sm">expand_more</span>
            </button>

            @if (showFilterDropdown()) {
            <div
              class="absolute z-40 top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-scale-in"
            >
              <div class="max-h-80 overflow-y-auto no-scrollbar">
                <button
                  (click)="applyFilter(null)"
                  class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                  [class.text-primary]="!currentFilter()"
                >
                  <span class="material-icons-outlined text-lg">apps</span>
                  All Categories
                </button>
                @for (cat of categories(); track cat.id) {
                <button
                  (click)="applyFilter(cat)"
                  class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-3"
                  [class.text-primary]="currentFilter() === cat.id"
                >
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <span class="material-icons-outlined text-xs">{{ cat.icons }}</span>
                  </div>
                  {{ ts.translateCategory(cat.name) }}
                </button>
                }
              </div>
            </div>
            }
          </div>

          <button
            (click)="openModal()"
            class="px-3 py-1.5 md:px-6 md:py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
          >
            <span class="material-icons-outlined mr-1 md:mr-2 text-lg md:text-2xl">add</span>
            <span class="text-xs md:text-base font-bold">{{ ts.t()('trans.add_expense') }}</span>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit backdrop-blur-sm border border-gray-200 dark:border-white/5"
      >
        <a
          routerLink="/incomes"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {{ ts.t()('nav.incomes') }}
        </a>
        <a
          routerLink="/expenses"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
        >
          {{ ts.t()('nav.expenses') }}
        </a>
      </div>

      <!-- List -->
      <!-- List -->
      <div
        class="glass-card overflow-hidden bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 animate-fade-in"
      >
        <!-- Skeleton Loader (Only initial load) -->
        @if (isLoading() && expenses().length === 0) {
        <div class="animate-pulse">
          <!-- Mobile Skeleton -->
          <div class="md:hidden divide-y divide-gray-200 dark:divide-white/5">
            @for (i of [1, 2, 3, 4, 5]; track $index) {
            <div class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10"></div>
                <div class="space-y-2">
                  <div class="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded"></div>
                  <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
                </div>
              </div>
              <div class="h-5 w-20 bg-gray-200 dark:bg-white/10 rounded"></div>
            </div>
            }
          </div>
          <!-- Desktop Skeleton -->
          <div class="hidden md:block p-4">
            <div class="space-y-4">
              @for (i of [1, 2, 3, 4, 5]; track $index) {
              <div class="flex items-center justify-between">
                <div class="h-4 w-1/4 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-4 w-1/6 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-4 w-1/6 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-4 w-1/6 bg-gray-200 dark:bg-white/10 rounded"></div>
              </div>
              }
            </div>
          </div>
        </div>
        }

        <!-- Mobile Card View (md:hidden) -->
        @if (expenses().length > 0 || !isLoading()) {
        <div
          class="md:hidden transition-opacity duration-300"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          @if (expenses().length === 0) {
          <div class="p-8 text-center text-gray-500 dark:text-gray-400">
            {{ ts.t()('trans.no_data') }}
          </div>
          }
          <div class="divide-y divide-gray-200 dark:divide-white/5">
            @for (item of expenses(); track trackById($index, item)) {
            <div
              (click)="openActionMenu(item)"
              class="animate-fade-in p-3 md:p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-white/5 transition-colors cursor-pointer"
            >
              <!-- Left: Icon & Desc -->
              <div class="flex items-center gap-3 overflow-hidden">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  [style.background-color]="item.category.color + '20'"
                >
                  <span class="material-icons-outlined text-lg" [style.color]="item.category.color">
                    {{ item.category.icons }}
                  </span>
                </div>
                <div class="min-w-0">
                  <p
                    class="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate"
                  >
                    {{ item.description }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ts.translateCategory(item.category.name) || 'General' }}
                  </p>
                </div>
              </div>

              <!-- Right: Amount & Date -->
              <div class="flex flex-col items-end gap-1 ml-2 shrink-0">
                <span class="font-bold text-sm md:text-base text-rose-600 dark:text-rose-400">
                  - {{ item.amount | currency : 'DOP' : 'symbol' : '1.2-2' }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ item.date | date : 'MMM d' }}
                </span>
              </div>

              <!-- Action Menu (Optional: could be a long press or slide, for now just simple click to edit?) -->
              <!-- Let's keep it simple: Clicking the row opens Edit. We can add specific buttons if needed but row click is standard mobile pattern -->
            </div>
            }
          </div>
        </div>
        }

        <!-- Desktop Table View (hidden md:block) -->
        @if (expenses().length > 0 || !isLoading()) {
        <div
          class="hidden md:block overflow-x-auto transition-opacity duration-300"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <table class="w-full text-left table-fixed">
            <thead
              class="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider"
            >
              <tr>
                <th class="p-4 font-medium w-5/12">{{ ts.t()('trans.desc') }}</th>
                <th class="p-4 font-medium w-2/12">{{ ts.t()('trans.category') }}</th>
                <th class="p-4 font-medium w-2/12">{{ ts.t()('trans.date') }}</th>
                <th class="p-4 font-medium text-right w-2/12">{{ ts.t()('trans.amount') }}</th>
                <th class="p-4 font-medium text-center w-1/12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-white/5">
              @for (item of expenses(); track trackById($index, item)) {
              <tr
                class="animate-fade-in hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td class="p-4 text-gray-900 dark:text-white font-medium">
                  <div class="truncate max-w-full" [title]="item.description">
                    {{ item.description }}
                  </div>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400">
                  <span
                    class="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                  >
                    {{ ts.translateCategory(item.category.name) || 'General' }}
                  </span>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400 text-sm">
                  {{ item.date | date }}
                </td>
                <td class="p-4 text-right font-bold text-rose-600 dark:text-rose-400">
                  - {{ item.amount | currency : 'DOP' : 'symbol' : '1.2-2' }}
                </td>
                <td class="p-4 text-center">
                  <div
                    class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      (click)="openModal(item)"
                      class="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <span class="material-icons-outlined text-lg">edit</span>
                    </button>
                    <button
                      (click)="deleteItem(item)"
                      class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <span class="material-icons-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              }

              <!-- Empty State -->
              @if (expenses().length === 0) {
              <tr>
                <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
                  {{ ts.t()('trans.no_data') }}
                </td>
              </tr>
              }
              <!-- Placeholder Rows to maintain fixed height -->
              @for (_ of getEmptyRows(); track $index) {
              <tr class="h-[73px]">
                <td colspan="5"></td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        }

        <!-- Pagination Controls -->
        <div
          class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5"
        >
          <button
            (click)="prevPage()"
            [disabled]="currentPage() === 0"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ ts.t()('trans.prev') }}
          </button>

          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ ts.t()('trans.page') }} {{ currentPage() + 1 }} {{ ts.t()('trans.of') }}
            {{ totalPages() || 1 }}
          </span>

          <button
            (click)="nextPage()"
            [disabled]="currentPage() >= totalPages() - 1"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ ts.t()('trans.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    @defer (when showModal()) { @if (showModal()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        class="glass-card w-full max-w-lg p-8 relative animate-scale-in bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl"
      >
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
        >
          <span class="material-icons-outlined">close</span>
        </button>

        <div class="text-center mb-8">
          <div
            class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-primary">
              receipt_long
            </span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ editingId() ? ts.t()('trans.edit_expense') : ts.t()('trans.add_expense') }}
          </h2>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Description -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ ts.t()('trans.desc') }}</label
            >
            <input
              formControlName="description"
              type="text"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>

          <!-- Amount & Date Row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >{{ ts.t()('trans.amount') }}</label
              >
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-500 dark:text-gray-400">$</span>
                <input
                  formControlName="amount"
                  type="text"
                  inputmode="decimal"
                  appCurrencyInput
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 pl-7 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400 dark:placeholder-gray-600"
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <label
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >{{ ts.t()('trans.date') }}</label
              >
              <div class="relative">
                <input
                  formControlName="date"
                  type="date"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <!-- Category -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ ts.t()('trans.category') }}</label
            >
            <div class="relative">
              <!-- Custom Trigger -->
              <button
                type="button"
                (click)="toggleDropdown()"
                class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left transition-colors hover:border-primary/50"
                [class.border-red-500]="
                  form.get('categoryId')?.invalid && form.get('categoryId')?.touched
                "
              >
                <div class="flex items-center gap-2">
                  @if (getSelectedCategory(); as selected) {
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="selected.color"
                  >
                    <span class="material-icons-outlined text-xs">{{ selected.icons }}</span>
                  </div>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ ts.translateCategory(selected.name) }}
                  </span>
                  } @else {
                  <span class="text-gray-400">
                    {{ ts.t()('trans.select_category') }}
                  </span>
                  }
                </div>
                <span
                  class="material-icons-outlined text-gray-400"
                  [class.rotate-180]="isDropdownOpen()"
                >
                  expand_more
                </span>
              </button>

              <!-- Dropdown Menu -->
              @if (isDropdownOpen()) {
              <div
                class="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto no-scrollbar animate-scale-in"
              >
                @for (cat of categories(); track trackById($index, cat)) {
                <button
                  type="button"
                  (click)="selectCategory(cat)"
                  class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div
                    class="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                    [style.background-color]="cat.color"
                  >
                    <span class="material-icons-outlined text-xs">{{ cat.icons }}</span>
                  </div>
                  <span class="text-gray-700 dark:text-gray-200 font-medium">
                    {{ ts.translateCategory(cat.name) }}
                  </span>
                </button>
                } @if (categories().length === 0) {
                <div class="p-4 text-center text-gray-500 text-sm">
                  {{ ts.t()('trans.loading_cat') }}
                </div>
                }
              </div>
              }
            </div>
          </div>

          <button
            type="submit"
            [disabled]="form.invalid"
            class="w-full mt-6 bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ editingId() ? 'Update' : ts.t()('trans.save') }}
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
            (click)="confirmDelete()"
            class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
          >
            {{ ts.t()('trans.delete') }}
          </button>
        </div>
      </div>
    </div>
    }

    <!-- Mobile Action Menu (Bottom Sheet) -->
    @if (showActionMenu()) {
    <div class="fixed inset-0 z-[100] flex items-end justify-center md:hidden">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="closeActionMenu()"
      ></div>

      <!-- Sheet -->
      <div
        class="bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 relative z-10 animate-slide-up border-t border-gray-200 dark:border-white/10 shadow-2xl"
      >
        <!-- Handle -->
        <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>

        <div class="mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {{ ts.t()('trans.actions') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ actionMenuItem()?.description }}
          </p>
        </div>

        <div class="space-y-3">
          <button
            (click)="onEditFromMenu()"
            class="w-full flex items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span class="material-icons-outlined mr-3 text-primary">edit</span>
            {{ ts.t()('trans.edit') || 'Edit' }}
          </button>

          <button
            (click)="onDeleteFromMenu()"
            class="w-full flex items-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <span class="material-icons-outlined mr-3">delete</span>
            {{ ts.t()('trans.delete') }}
          </button>

          <button
            (click)="closeActionMenu()"
            class="w-full p-4 text-center text-gray-500 dark:text-gray-400 font-medium mt-2"
          >
            {{ ts.t()('trans.cancel') }}
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class ExpensesComponent implements OnInit, OnDestroy {
  // State Service
  state = inject(ExpenseStateService);
  private route = inject(ActivatedRoute);

  // UI State
  categories = signal<Category[]>([]);
  isDeleting = signal<number | null>(null);

  // Pagination (UI driven)
  pageSize = signal(6);

  // Computed Signals from State
  expenses = this.state.expenses;
  isLoading = this.state.isLoading;
  totalItems = this.state.totalElements;
  totalPages = this.state.totalPages;
  currentPage = this.state.currentPage;

  // Helpers
  getEmptyRows() {
    if (this.totalItems() <= this.pageSize()) return [];
    const curLen = this.expenses().length;
    const emptyCount = this.pageSize() - curLen;
    return emptyCount > 0 ? new Array(emptyCount) : [];
  }

  private refreshSubscription: Subscription | null = null;

  // Forms & Modals
  form: FormGroup;
  showModal = signal(false);
  editingId = signal<number | null>(null);

  // Dropdown state
  isDropdownOpen = signal(false);

  // Delete Modal State
  showDeleteModal = signal(false);
  itemToDelete = signal<any>(null);

  // Mobile Action Menu State
  showActionMenu = signal(false);
  actionMenuItem = signal<any>(null);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public ts: TranslationService,
    private ns: NotificationService
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      currency: ['DOP'],
      categoryId: [null, Validators.required],
    });
  }

  ngOnInit() {
    const qp = this.route.snapshot.queryParams;
    if (qp['category']) {
      const catId = Number(qp['category']);
      if (!isNaN(catId)) {
        this.state.setFilter(catId);
      }
    }
    if (qp['month'] && qp['year']) {
      const month = Number(qp['month']);
      const year = Number(qp['year']);
      if (!isNaN(month) && !isNaN(year)) {
        this.state.setDateFilter(month, year);
      }
    }

    this.state.refresh();
    this.loadCategories();

    // Poll every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.state.refresh();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  trackById(index: number, item: any): string {
    return `${item.id}-${this.state.categoryFilter() || 'all'}`;
  }

  // Action Menu
  openActionMenu(item: any) {
    this.actionMenuItem.set(item);
    this.showActionMenu.set(true);
  }

  closeActionMenu() {
    this.showActionMenu.set(false);
    this.actionMenuItem.set(null);
  }

  // Filter Logic
  showFilterDropdown = signal(false);
  currentFilter = this.state.categoryFilter; // Read from service

  toggleFilterDropdown() {
    this.showFilterDropdown.update((v) => !v);
  }

  applyFilter(category: Category | null) {
    this.state.setFilter(category ? category.id : null);
    this.showFilterDropdown.set(false);
  }

  getFilterLabel(): string {
    const id = this.currentFilter();
    if (!id) return 'All Categories';
    const cat = this.categories().find((c) => c.id === id);
    return cat ? this.ts.translateCategory(cat.name) : 'Category';
  }

  // Date Filter Logic
  isMonthPickerOpen = signal(false);
  currentDateFilter = this.state.dateFilter;

  toggleMonthPicker() {
    this.isMonthPickerOpen.update((v) => !v);
  }

  selectMonth(month: number | null, year: number | null) {
    this.state.setDateFilter(month, year);
    this.isMonthPickerOpen.set(false);
  }

  getDateFilterLabel(): string {
    const filter = this.currentDateFilter();
    if (!filter) return 'All Time';
    const date = new Date(filter.year, filter.month - 1);
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  }

  getAvailableMonths(): { month: number; year: number; label: string }[] {
    // Generate last 13 months for filtering (Current + 12 previous)
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 13; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      dates.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d),
      });
    }
    return dates;
  }

  onEditFromMenu() {
    const item = this.actionMenuItem();
    this.closeActionMenu();
    if (item) this.openModal(item);
  }

  onDeleteFromMenu() {
    const item = this.actionMenuItem();
    this.closeActionMenu();
    if (item) this.deleteItem(item);
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.categories.set(res);
        }
      },
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  // Pagination
  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.state.load(this.currentPage() + 1, this.pageSize());
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.state.load(this.currentPage() - 1, this.pageSize());
    }
  }

  // Dropdown
  toggleDropdown() {
    this.isDropdownOpen.update((v) => !v);
  }

  selectCategory(category: Category) {
    this.form.patchValue({ categoryId: category.id });
    this.isDropdownOpen.set(false);
  }

  getSelectedCategory(): Category | undefined {
    const id = this.form.get('categoryId')?.value;
    return this.categories().find((c) => c.id === id);
  }

  // CRUD
  openModal(itemToEdit: any = null) {
    this.isDropdownOpen.set(false);
    if (itemToEdit) {
      this.editingId.set(itemToEdit.id);
      this.form.patchValue({
        description: itemToEdit.description,
        amount: itemToEdit.amount,
        date: new Date(itemToEdit.date).toISOString().split('T')[0],
        currency: 'DOP',
        categoryId: itemToEdit.category?.id || 1,
      });
    } else {
      this.editingId.set(null);
      this.form.reset({
        date: new Date().toISOString().split('T')[0],
        currency: 'DOP',
        categoryId: null,
        amount: 0,
        description: '',
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.isDropdownOpen.set(false);
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      const id = this.editingId();
      const payload = { ...formData, categoryId: Number(formData.categoryId) };

      // Optimistic Close
      this.closeModal();

      let obs$;
      if (id) {
        // Find the category object for optimistic update
        const selectedCat = this.categories().find((c) => c.id === payload.categoryId);
        obs$ = this.state.update(id, payload, selectedCat);
      } else {
        obs$ = this.state.add(payload);
      }

      obs$.subscribe({
        next: () => {
          const isEdit = !!id;
          const msg = isEdit ? 'notif.expense_updated' : 'notif.expense_created';
          this.ns.show(msg, 'success');
        },
        error: (err) => {
          console.error('Operation failed', err);
          this.ns.show(err.error?.message || 'Operation failed', 'error');
        },
      });
    }
  }

  deleteItem(item: any) {
    this.itemToDelete.set(item);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    // Optimistic Close
    this.cancelDelete();

    this.state.delete(Number(item.id)).subscribe({
      next: () => {
        this.ns.show('notif.expense_deleted', 'success');
      },
      error: (err) => {
        console.error('Error deleting expense', err);
        this.ns.show('notif.expense_delete_fail', 'error');
      },
    });
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: any) {
    if (event.key === 'Escape') {
      if (this.showActionMenu()) {
        this.closeActionMenu();
        return;
      }
      if (this.showDeleteModal()) {
        this.cancelDelete();
        return;
      }
      if (this.showModal()) {
        this.closeModal();
      }
    } else if (event.key === 'Enter') {
      if (this.showDeleteModal()) {
        event.preventDefault();
        event.stopPropagation();
        this.confirmDelete();
        return;
      }
      // Ctrl+Enter to save form
      if (this.showModal() && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.onSubmit();
      }
    } else if ((event.altKey && event.key === 'n') || (event.altKey && event.key === 'N')) {
      // Alt + N to open Add Modal
      if (!this.showModal() && !this.showDeleteModal()) {
        event.preventDefault();
        this.openModal();
      }
    }
  }
}
