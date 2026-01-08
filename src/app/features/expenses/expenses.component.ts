import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ExpenseResponse, Category } from '../../core/models/api.models';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CurrencyInputDirective],
  animations: [
    trigger('fadeOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
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
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
        >
          <span class="material-icons-outlined mr-2">add</span>
          {{ ts.t()('trans.add_expense') }}
        </button>
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
        <div *ngIf="isLoading() && expenses().length === 0" class="animate-pulse">
          <!-- Mobile Skeleton -->
          <div class="md:hidden divide-y divide-gray-200 dark:divide-white/5">
            <div *ngFor="let i of [1, 2, 3, 4, 5]" class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10"></div>
                <div class="space-y-2">
                  <div class="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded"></div>
                  <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
                </div>
              </div>
              <div class="h-5 w-20 bg-gray-200 dark:bg-white/10 rounded"></div>
            </div>
          </div>
          <!-- Desktop Skeleton -->
          <div class="hidden md:block p-4">
            <div class="space-y-4">
              <div *ngFor="let i of [1, 2, 3, 4, 5]" class="flex items-center justify-between">
                <div class="h-4 w-1/4 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-4 w-1/6 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-4 w-1/6 bg-gray-200 dark:bg-white/10 rounded"></div>
                <div class="h-4 w-1/6 bg-gray-200 dark:bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Card View (md:hidden) -->
        <div
          class="md:hidden transition-opacity duration-300"
          *ngIf="expenses().length > 0 || !isLoading()"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <div
            *ngIf="expenses().length === 0"
            class="p-8 text-center text-gray-500 dark:text-gray-400"
          >
            {{ ts.t()('trans.no_data') }}
          </div>
          <div class="divide-y divide-gray-200 dark:divide-white/5">
            <div
              *ngFor="let item of expenses(); trackBy: trackById"
              (click)="openActionMenu(item)"
              class="p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-white/5 transition-colors cursor-pointer"
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
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ item.description }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ts.translateCategory(item.category.name) || 'General' }}
                  </p>
                </div>
              </div>

              <!-- Right: Amount & Date -->
              <div class="flex flex-col items-end gap-1 ml-2 shrink-0">
                <span class="font-bold text-rose-600 dark:text-rose-400">
                  - {{ item.amount | currency : 'DOP' : 'symbol' : '1.0-0' }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ item.date | date : 'MMM d' }}
                </span>
              </div>

              <!-- Action Menu (Optional: could be a long press or slide, for now just simple click to edit?) -->
              <!-- Let's keep it simple: Clicking the row opens Edit. We can add specific buttons if needed but row click is standard mobile pattern -->
            </div>
          </div>
        </div>

        <!-- Desktop Table View (hidden md:block) -->
        <div
          class="hidden md:block overflow-x-auto transition-opacity duration-300"
          *ngIf="expenses().length > 0 || !isLoading()"
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
              <tr
                *ngFor="let item of expenses(); trackBy: trackById"
                [@fadeOut]
                class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
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
                  <div class="flex items-center justify-end gap-1 opacity-100">
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

              <!-- Empty State -->
              <tr *ngIf="expenses().length === 0">
                <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
                  {{ ts.t()('trans.no_data') }}
                </td>
              </tr>
              <!-- Placeholder Rows to maintain fixed height -->
              <tr *ngFor="let _ of getEmptyRows()" class="h-[73px]">
                <td colspan="5"></td>
              </tr>
            </tbody>
          </table>
        </div>

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
    <div
      *ngIf="showModal()"
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
            <span class="material-icons-outlined text-3xl text-primary dark:text-primary-light">
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
              <div
                (click)="toggleDropdown()"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group"
                [class.border-red-500]="
                  form.get('categoryId')?.invalid && form.get('categoryId')?.touched
                "
              >
                <div class="flex items-center gap-2">
                  <ng-container *ngIf="getSelectedCategory() as selected; else placeholder">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      [style.background-color]="selected.color + '20'"
                    >
                      <span class="material-icons-outlined text-lg" [style.color]="selected.color">
                        {{ selected.icons }}
                      </span>
                    </div>
                    <span class="text-gray-900 dark:text-white font-medium">
                      {{ ts.translateCategory(selected.name) }}
                    </span>
                  </ng-container>
                  <ng-template #placeholder>
                    <span class="text-gray-400">
                      {{ ts.t()('trans.select_category') }}
                    </span>
                  </ng-template>
                </div>
                <span
                  class="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors"
                  [class.rotate-180]="isDropdownOpen()"
                >
                  expand_more
                </span>
              </div>

              <!-- Dropdown Menu -->
              <div
                *ngIf="isDropdownOpen()"
                class="custom-scrollbar absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-scale-in"
              >
                <div
                  *ngFor="let cat of categories(); trackBy: trackById"
                  (click)="selectCategory(cat)"
                  class="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    [style.background-color]="cat.color + '20'"
                  >
                    <span class="material-icons-outlined text-lg" [style.color]="cat.color">
                      {{ cat.icons }}
                    </span>
                  </div>
                  <span class="text-gray-700 dark:text-gray-200 font-medium">
                    {{ ts.translateCategory(cat.name) }}
                  </span>
                </div>
                <div
                  *ngIf="categories().length === 0"
                  class="p-4 text-center text-gray-500 text-sm"
                >
                  {{ ts.t()('trans.loading_cat') }}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="form.invalid"
            class="w-full mt-6 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ editingId() ? 'Update' : ts.t()('trans.save') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Delete Modal -->
    <div
      *ngIf="showDeleteModal()"
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

    <!-- Mobile Action Menu (Bottom Sheet) -->
    <div
      *ngIf="showActionMenu()"
      class="fixed inset-0 z-[100] flex items-end justify-center md:hidden"
    >
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
  `,
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses = signal<ExpenseResponse[]>([]);
  categories = signal<Category[]>([]);

  isLoading = signal(true);
  isDeleting = signal<number | null>(null);

  // Pagination
  // Pagination
  currentPage = signal(0);
  pageSize = signal(6);
  totalItems = signal(0);
  totalPages = signal(0);

  getEmptyRows() {
    if (this.totalItems() <= this.pageSize()) {
      return [];
    }
    const emptyCount = this.pageSize() - this.expenses().length;
    return emptyCount > 0 ? new Array(emptyCount) : [];
  }

  private refreshSubscription: Subscription | null = null;

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
    this.loadData();
    this.loadCategories();

    // Poll every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadData(true);
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  openActionMenu(item: any) {
    this.actionMenuItem.set(item);
    this.showActionMenu.set(true);
  }

  closeActionMenu() {
    this.showActionMenu.set(false);
    this.actionMenuItem.set(null);
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

  loadData(isBackground: boolean = false) {
    if (!isBackground) this.isLoading.set(true);

    this.apiService.getExpenses(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        // Backend pagination is 0-indexed
        const sorted = res.content.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.expenses.set(sorted);
        this.totalItems.set(res.page.totalElements);
        this.totalPages.set(res.page.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading expenses', err);
        this.isLoading.set(false);
      },
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadData();
    }
  }

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

      if (id) {
        this.apiService.updateExpense(id, payload).subscribe(this.handleResponseObserver);
      } else {
        this.apiService.createExpense(payload).subscribe(this.handleResponseObserver);
      }
    }
  }

  private handleResponseObserver = {
    next: () => {
      const isEdit = !!this.editingId();
      this.closeModal();
      this.loadData();
      const msg = isEdit ? 'notif.expense_updated' : 'notif.expense_created';
      this.ns.show(msg, 'success');
    },
    error: (err: any) => {
      console.error('Operation failed', err);
      this.ns.show(err.error?.message || 'Operation failed', 'error');
    },
  };

  deleteItem(item: any) {
    this.itemToDelete.set(item);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    // Optimistic Delete
    const previousList = this.expenses();
    this.expenses.update((current) => current.filter((e) => e.id !== item.id));
    this.cancelDelete();
    this.ns.show('notif.expense_deleted', 'success');

    this.apiService.deleteExpense(Number(item.id)).subscribe({
      next: () => {
        // Success - UI already updated
        // Background refresh to catch side effects like balance update
        this.loadData(true);
      },
      error: (err) => {
        console.error('Error deleting expense', err);
        // Revert
        this.expenses.set(previousList);
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
