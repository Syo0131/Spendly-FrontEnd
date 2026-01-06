import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { IncomeResponse } from '../../core/models/api.models';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-incomes',
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
            {{ ts.t()('nav.incomes') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">Manage your sources of income</p>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
        >
          <span class="material-icons-outlined mr-2">add</span>
          {{ ts.t()('trans.add_income') }}
        </button>
      </div>

      <!-- Tabs -->
      <div
        class="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit backdrop-blur-sm border border-gray-200 dark:border-white/5"
      >
        <a
          routerLink="/incomes"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
        >
          {{ ts.t()('nav.incomes') }}
        </a>
        <a
          routerLink="/expenses"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        <div *ngIf="isLoading() && incomes().length === 0" class="animate-pulse">
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
          *ngIf="incomes().length > 0 || !isLoading()"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <div
            *ngIf="incomes().length === 0"
            class="p-8 text-center text-gray-500 dark:text-gray-400"
          >
            {{ ts.t()('trans.no_data') }}
          </div>
          <div class="divide-y divide-gray-200 dark:divide-white/5">
            <div
              *ngFor="let item of incomes(); trackBy: trackById"
              (click)="openActionMenu(item)"
              class="p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-white/5 transition-colors cursor-pointer"
            >
              <!-- Left: Icon & Desc -->
              <div class="flex items-center gap-3 overflow-hidden">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-teal-100 dark:bg-teal-900/30"
                >
                  <span class="material-icons-outlined text-lg text-teal-600 dark:text-teal-400">
                    attach_money
                  </span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ item.description }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ item.date | date : 'MMM d' }}
                  </p>
                </div>
              </div>

              <!-- Right: Amount -->
              <div class="flex flex-col items-end gap-1 ml-2 shrink-0">
                <span class="font-bold text-teal-600 dark:text-teal-400">
                  + {{ item.amount | currency : 'DOP' : 'symbol' : '1.0-0' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table View (hidden md:block) -->
        <div
          class="hidden md:block overflow-x-auto transition-opacity duration-300"
          *ngIf="incomes().length > 0 || !isLoading()"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <table class="w-full text-left table-fixed">
            <thead
              class="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider"
            >
              <tr>
                <th class="p-4 font-medium w-6/12">{{ ts.t()('trans.desc') }}</th>
                <th class="p-4 font-medium w-2/12">{{ ts.t()('trans.date') }}</th>
                <th class="p-4 font-medium text-right w-3/12">{{ ts.t()('trans.amount') }}</th>
                <th class="p-4 font-medium text-center w-1/12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-white/5">
              <tr
                *ngFor="let item of incomes(); trackBy: trackById"
                [@fadeOut]
                class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td class="p-4 text-gray-900 dark:text-white font-medium">
                  <div class="truncate max-w-full" [title]="item.description">
                    {{ item.description }}
                  </div>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400 text-sm">
                  {{ item.date | date }}
                </td>
                <td class="p-4 text-right font-bold text-teal-600 dark:text-teal-400">
                  + {{ item.amount | currency : 'DOP' : 'symbol' : '1.2-2' }}
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
              <tr *ngIf="incomes().length === 0">
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
              attach_money
            </span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ editingId() ? ts.t()('trans.edit_income') : ts.t()('trans.add_income') }}
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
  styles: [],
})
export class IncomesComponent implements OnInit, OnDestroy {
  incomes = signal<IncomeResponse[]>([]);

  isLoading = signal(true);
  isDeleting = signal<number | null>(null);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(6);
  totalItems = signal(0);
  totalPages = signal(0);

  getEmptyRows() {
    const emptyCount = this.pageSize() - this.incomes().length;
    return emptyCount > 0 ? new Array(emptyCount) : [];
  }

  private refreshSubscription: Subscription | null = null;

  form: FormGroup;
  showModal = signal(false);
  editingId = signal<number | null>(null);

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
    });
  }

  ngOnInit() {
    this.loadData();
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

  loadData(isBackground: boolean = false) {
    if (!isBackground) this.isLoading.set(true);

    this.apiService.getIncomes(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        const sorted = res.content.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.incomes.set(sorted);
        this.totalItems.set(res.page.totalElements);
        this.totalPages.set(res.page.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading incomes', err);
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

  openModal(itemToEdit: any = null) {
    if (itemToEdit) {
      this.editingId.set(itemToEdit.id);
      this.form.patchValue({
        description: itemToEdit.description,
        amount: itemToEdit.amount,
        date: new Date(itemToEdit.date).toISOString().split('T')[0],
        currency: 'DOP',
      });
    } else {
      this.editingId.set(null);
      this.form.reset({
        date: new Date().toISOString().split('T')[0],
        currency: 'DOP',
        amount: 0,
        description: '',
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      const id = this.editingId();
      let payload = { ...formData };

      if (id) {
        // Preserve original fields like fixedSalary if not in form
        const originalItem = this.incomes().find((i) => i.id === id);
        if (originalItem) {
          payload = { ...originalItem, ...payload };
        }

        this.apiService.updateIncome(id, payload).subscribe(this.handleResponseObserver);
      } else {
        this.apiService.createIncome(payload).subscribe(this.handleResponseObserver);
      }
    }
  }

  private handleResponseObserver = {
    next: () => {
      const msg = this.editingId() ? 'notif.income_updated' : 'notif.income_created';
      this.closeModal();
      this.loadData();
      this.ns.show(msg, 'success');
    },
    error: (err: any) => {
      console.error('Operation failed', err);
      this.ns.show('error', err.error?.message || 'Operation failed');
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
    const previousList = this.incomes();
    this.incomes.update((current) => current.filter((i) => i.id !== item.id));
    this.cancelDelete();
    this.ns.show('notif.income_deleted', 'success');

    this.apiService.deleteIncome(Number(item.id)).subscribe({
      next: () => {
        // Success - already updated UI
        this.loadData(true);
      },
      error: (err) => {
        console.error('Error deleting income', err);
        // Revert
        this.incomes.set(previousList);
        this.ns.show('notif.income_delete_fail', 'error');
      },
    });
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }
}
